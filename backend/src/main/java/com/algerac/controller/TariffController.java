package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.TariffService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * PRO_18 / PRO_18-1 : Contrôleur pour la gestion des tarifs et frais d'accréditation.
 */
@RestController
@RequestMapping("/api/tariffs")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class TariffController {

    private final TariffService tariffService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createTariff(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            TariffGrid grid = tariffService.createTariffGrid(
                (String) body.get("name"),
                TariffCategory.valueOf((String) body.get("category")),
                (Boolean) body.get("forNational"),
                (Boolean) body.get("forForeign"),
                (String) body.get("domain"),
                (String) body.get("oecType"),
                toBD(body, "registrationFee"),
                toBD(body, "evalFeePerDay"),
                toBD(body, "docReviewFee"),
                toBD(body, "surveillanceFee"),
                toBD(body, "renewalFee"),
                toBD(body, "extensionFee"),
                toBD(body, "travelSupplement"),
                toBD(body, "adminFee"),
                toBD(body, "annualFee"),
                toBD(body, "certificateDeliveryFee"),
                toBD(body, "certificateModificationFee"),
                toBD(body, "certificateTranslationFee"),
                toBD(body, "suspensionLiftFee"),
                toBD(body, "transferFlatRate"),
                toBD(body, "multiSiteAdditionalSiteFee"),
                body.get("paymentTermDaysEvaluation") != null ? ((Number) body.get("paymentTermDaysEvaluation")).intValue() : 20,
                body.get("paymentTermDaysAnnual") != null ? ((Number) body.get("paymentTermDaysAnnual")).intValue() : 60,
                (String) body.get("currency"),
                body.get("minDays") != null ? ((Number) body.get("minDays")).intValue() : null,
                body.get("maxDays") != null ? ((Number) body.get("maxDays")).intValue() : null,
                body.get("effectiveDate") != null ? LocalDateTime.parse((String) body.get("effectiveDate")) : null,
                (String) body.get("notes"), user);
            return ResponseEntity.ok(ApiResponse.success("Grille tarifaire créée", grid));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTariff(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            TariffGrid grid = tariffService.updateTariffGrid(id, body);
            return ResponseEntity.ok(ApiResponse.success("Grille tarifaire mise à jour", grid));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Tarif activé", tariffService.activateTariff(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable Long id, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Tarif archivé", tariffService.archiveTariff(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Grille tarifaire", tariffService.getTariffById(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/calculate/national")
    public ResponseEntity<?> calculateNational(@RequestParam String domain, @RequestParam String oecType,
            @RequestParam String category, @RequestParam int days) {
        try {
            BigDecimal total = tariffService.calculateNationalQuotation(domain, oecType,
                TariffCategory.valueOf(category), days);
            return ResponseEntity.ok(ApiResponse.success("Montant calculé", Map.of("total", total)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/calculate/foreign")
    public ResponseEntity<?> calculateForeign(@RequestParam String domain, @RequestParam String oecType,
            @RequestParam String category, @RequestParam int days) {
        try {
            BigDecimal total = tariffService.calculateForeignQuotation(domain, oecType,
                TariffCategory.valueOf(category), days);
            return ResponseEntity.ok(ApiResponse.success("Montant calculé", Map.of("total", total)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PRO_18 §5.5 / §5.17 : Calcul de la redevance annuelle proratée.
     * Formule : (annualFee / 12) × M  où M = nombre de mois entiers jusqu'à fin d'année.
     */
    @GetMapping("/calculate/annual-prorated")
    public ResponseEntity<?> calculateAnnualProrated(
            @RequestParam BigDecimal annualFee,
            @RequestParam int effectiveMonth) {
        try {
            BigDecimal prorated = tariffService.calculateAnnualFeeProrated(annualFee, effectiveMonth);
            int M = 13 - effectiveMonth;
            return ResponseEntity.ok(ApiResponse.success("Redevance annuelle proratée", Map.of(
                "annualFee", annualFee,
                "effectiveMonth", effectiveMonth,
                "monthsM", M,
                "proratedAmount", prorated,
                "formula", "(" + annualFee + " / 12) × " + M + " = " + prorated
            )));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PRO_18 §5.8 : Calcul combiné Extension + Surveillance simultanée.
     * 50/50 frais équipe + 30% réduction analyse documentaire extension.
     */
    @GetMapping("/calculate/extension-surveillance")
    public ResponseEntity<?> calculateExtensionWithSurveillance(
            @RequestParam BigDecimal evaluationFeeTotal,
            @RequestParam BigDecimal extensionDocReviewFee) {
        try {
            var result = tariffService.calculateExtensionWithSurveillance(evaluationFeeTotal, extensionDocReviewFee);
            return ResponseEntity.ok(ApiResponse.success("Calcul extension + surveillance", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Grilles tarifaires", tariffService.getAllTariffs()));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(ApiResponse.success("Tarifs actifs", tariffService.getActiveTariffs()));
    }

    @GetMapping("/national")
    public ResponseEntity<?> getNational() {
        return ResponseEntity.ok(ApiResponse.success("Tarifs nationaux", tariffService.getNationalTariffs()));
    }

    @GetMapping("/foreign")
    public ResponseEntity<?> getForeign() {
        return ResponseEntity.ok(ApiResponse.success("Tarifs étrangers", tariffService.getForeignTariffs()));
    }

    @PostMapping("/expire-obsolete")
    public ResponseEntity<?> expireObsolete(HttpSession session) {
        try {
            getSessionUser(session);
            int count = tariffService.expireObsoleteTariffs();
            return ResponseEntity.ok(ApiResponse.success(count + " tarifs expirés", Map.of("count", count)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private BigDecimal toBD(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val == null || val.toString().isBlank()) return null;
        try { return new BigDecimal(val.toString()); } catch (NumberFormatException e) { return null; }
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
