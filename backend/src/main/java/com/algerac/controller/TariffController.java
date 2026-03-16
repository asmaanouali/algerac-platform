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
                new BigDecimal(body.get("registrationFee").toString()),
                body.get("evalFeePerDay") != null ? new BigDecimal(body.get("evalFeePerDay").toString()) : null,
                body.get("docReviewFee") != null ? new BigDecimal(body.get("docReviewFee").toString()) : null,
                body.get("surveillanceFee") != null ? new BigDecimal(body.get("surveillanceFee").toString()) : null,
                body.get("renewalFee") != null ? new BigDecimal(body.get("renewalFee").toString()) : null,
                body.get("extensionFee") != null ? new BigDecimal(body.get("extensionFee").toString()) : null,
                body.get("travelSupplement") != null ? new BigDecimal(body.get("travelSupplement").toString()) : null,
                body.get("adminFee") != null ? new BigDecimal(body.get("adminFee").toString()) : null,
                body.get("minDays") != null ? ((Number) body.get("minDays")).intValue() : null,
                body.get("maxDays") != null ? ((Number) body.get("maxDays")).intValue() : null,
                body.get("effectiveDate") != null ? LocalDateTime.parse((String) body.get("effectiveDate")) : null,
                (String) body.get("notes"), user);
            return ResponseEntity.ok(ApiResponse.success("Grille tarifaire créée", grid));
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

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
