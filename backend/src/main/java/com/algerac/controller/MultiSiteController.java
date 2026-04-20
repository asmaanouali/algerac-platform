package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.MultiSiteDTO;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.MultiSiteService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PRO_26 : Contrôleur REST pour l'accréditation des OEC multi-sites.
 *
 * Workflow: DRAFT → SUBMITTED → CD_REVIEW → VALIDATED | CHANGES_REQUESTED → ACTIVE → ARCHIVED
 */
@RestController
@RequestMapping("/api/multi-site")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class MultiSiteController {

    private final MultiSiteService multiSiteService;
    private final UserRepository userRepository;

    /** Créer une nouvelle configuration multi-site (PRO_26 §5.2) */
    @PostMapping
    public ResponseEntity<?> createConfig(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            MultiSiteDTO dto = multiSiteService.createConfig(
                ((Number) body.get("requestId")).longValue(),
                (String) body.get("mainSiteName"),
                (String) body.get("mainSiteAddress"),
                (String) body.get("mainSiteContact"),
                (String) body.get("mainSiteEmail"),
                body.get("centralizedSystem") != null ? (Boolean) body.get("centralizedSystem") : true,
                (String) body.get("managementSystemDesc"),
                body.get("totalSatellites") != null ? ((Number) body.get("totalSatellites")).intValue() : 0,
                (String) body.get("satelliteSites"),
                (String) body.get("selectionCriteria"),
                user);
            return ResponseEntity.ok(ApiResponse.success("Configuration multi-site créée", dto));
        } catch (Exception e) {
            log.error("Erreur création config multi-site: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Mettre à jour une configuration existante */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateConfig(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            MultiSiteDTO dto = multiSiteService.updateConfig(id,
                (String) body.get("mainSiteName"),
                (String) body.get("mainSiteAddress"),
                (String) body.get("mainSiteContact"),
                (String) body.get("mainSiteEmail"),
                body.get("centralizedSystem") != null ? (Boolean) body.get("centralizedSystem") : true,
                (String) body.get("managementSystemDesc"),
                body.get("totalSatellites") != null ? ((Number) body.get("totalSatellites")).intValue() : 0,
                (String) body.get("satelliteSites"),
                (String) body.get("selectionCriteria"),
                (String) body.get("siteSamplingJustification"),
                (String) body.get("evaluationSchedule"),
                (String) body.get("evaluationFindings"),
                user);
            return ResponseEntity.ok(ApiResponse.success("Configuration mise à jour", dto));
        } catch (Exception e) {
            log.error("Erreur mise à jour config multi-site {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Récupérer une configuration par son ID */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Configuration multi-site", multiSiteService.getById(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Soumettre pour revue CD (DRAFT/CHANGES_REQUESTED → SUBMITTED) */
    @PutMapping("/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Soumis pour revue CD",
                multiSiteService.submitForValidation(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** CD prend en charge la revue (SUBMITTED → CD_REVIEW) */
    @PutMapping("/{id}/cd-review")
    public ResponseEntity<?> startCdReview(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Revue CD démarrée",
                multiSiteService.startCdReview(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Décision CD: valider ou demander des modifications (§5.2.1 recevabilité) */
    @PutMapping("/{id}/decide")
    public ResponseEntity<?> decide(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            boolean approved = Boolean.TRUE.equals(body.get("approved"));
            String comments = (String) body.get("comments");
            return ResponseEntity.ok(ApiResponse.success(
                approved ? "Configuration validée par le CD" : "Modifications demandées",
                multiSiteService.cdDecide(id, approved, comments, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Activer la configuration (VALIDATED → ACTIVE) */
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Configuration activée",
                multiSiteService.activate(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Archiver la configuration */
    @PutMapping("/{id}/archive")
    public ResponseEntity<?> archive(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Configuration archivée",
                multiSiteService.archive(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /** Récupérer toutes les configurations d'une demande */
    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success("Configs multi-site de la demande",
            multiSiteService.getByRequest(requestId)));
    }

    /** Récupérer toutes les configurations (triées par date) */
    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Toutes les configurations multi-site",
            multiSiteService.getAll()));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
