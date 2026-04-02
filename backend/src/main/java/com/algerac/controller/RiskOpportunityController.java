package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.RiskOpportunityService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

/**
 * PRO_30 : Contrôleur pour la gestion des risques et opportunités.
 * Accès : RQ (principal), CD, DT (identification/analyse), DG (validation)
 */
@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class RiskOpportunityController {

    private final RiskOpportunityService riskService;
    private final UserRepository userRepository;

    private static final Set<String> IDENTIFY_ROLES = Set.of("RQ", "CD", "DT");
    private static final Set<String> ANALYZE_ROLES = Set.of("RQ", "CD", "DT");
    private static final Set<String> SUBMIT_ROLES = Set.of("RQ");
    private static final Set<String> VALIDATE_ROLES = Set.of("DG");
    private static final Set<String> TREATMENT_ROLES = Set.of("RQ");
    private static final Set<String> MONITOR_ROLES = Set.of("RQ", "CD", "DT");
    private static final Set<String> VIEW_ROLES = Set.of("RQ", "CD", "DT", "DG");

    /**
     * §5.1 — Identifier un risque/opportunité (CD+DT+RQ)
     */
    @PostMapping
    public ResponseEntity<?> identify(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, IDENTIFY_ROLES, "identifier un risque");

            RiskOpportunityRegister result = riskService.identify(
                RiskType.valueOf((String) body.get("type")),
                (String) body.get("title"),
                (String) body.get("description"),
                RiskCategory.valueOf((String) body.get("category")),
                (String) body.get("source"),
                (String) body.get("department"),
                user);
            return ResponseEntity.ok(ApiResponse.success("Risque/Opportunité identifié(e)", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * §5.2 — Analyser (renseigner conséquence + vraisemblance) (CD+DT+RQ)
     */
    @PutMapping("/{id}/analyze")
    public ResponseEntity<?> analyze(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, ANALYZE_ROLES, "analyser un risque");

            return ResponseEntity.ok(ApiResponse.success("Risque analysé",
                riskService.analyze(id,
                    RiskLikelihood.valueOf((String) body.get("likelihood")),
                    RiskImpact.valueOf((String) body.get("impact")),
                    (String) body.get("residualDocControl"),
                    (String) body.get("residualCompetence"),
                    (String) body.get("residualControlLevel"),
                    body.get("residualMastery") != null ? RiskMastery.valueOf((String) body.get("residualMastery")) : null,
                    user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * §5.3 — Soumettre à la DG (RQ uniquement)
     */
    @PutMapping("/{id}/submit-dg")
    public ResponseEntity<?> submitToDG(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, SUBMIT_ROLES, "soumettre à la DG");

            return ResponseEntity.ok(ApiResponse.success("Soumis à la DG pour vérification",
                riskService.submitToDG(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * §5.4 — Valider par la DG
     */
    @PutMapping("/{id}/validate")
    public ResponseEntity<?> validateByDG(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, VALIDATE_ROLES, "valider un risque");

            return ResponseEntity.ok(ApiResponse.success("Validé par la DG",
                riskService.validateByDG(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * §5.4 — Mettre en traitement (RQ)
     */
    @PutMapping("/{id}/start-treatment")
    public ResponseEntity<?> startTreatment(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, TREATMENT_ROLES, "démarrer le traitement");

            return ResponseEntity.ok(ApiResponse.success("Traitement démarré",
                riskService.startTreatment(id,
                    (String) body.get("mitigationActions"),
                    (String) body.get("actionPlan"),
                    body.get("deadline") != null ? LocalDate.parse((String) body.get("deadline")) : null)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * §5.5 — Suivi et revue (RQ+CD+DT)
     */
    @PutMapping("/{id}/monitor")
    public ResponseEntity<?> monitor(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, MONITOR_ROLES, "effectuer le suivi");

            return ResponseEntity.ok(ApiResponse.success("Suivi effectué",
                riskService.monitor(id,
                    (String) body.get("reviewNotes"),
                    (String) body.get("actionProgress"),
                    body.get("nextReview") != null ? LocalDate.parse((String) body.get("nextReview")) : null)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Clôturer
     */
    @PutMapping("/{id}/close")
    public ResponseEntity<?> close(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, Set.of("RQ", "DG"), "clôturer");

            return ResponseEntity.ok(ApiResponse.success("Clôturé",
                riskService.close(id, (String) body.get("residualNotes"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll(HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, VIEW_ROLES, "consulter les risques");
            return ResponseEntity.ok(ApiResponse.success("Registre", riskService.getAll()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/pending-validation")
    public ResponseEntity<?> getPendingValidation(HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, VALIDATE_ROLES, "voir les validations en attente");
            return ResponseEntity.ok(ApiResponse.success("En attente",
                riskService.getByStatus(RiskRegisterStatus.PENDING_VALIDATION)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/overdue-reviews")
    public ResponseEntity<?> getOverdue(HttpSession session) {
        try {
            User user = getSessionUser(session);
            checkRole(user, VIEW_ROLES, "voir les revues en retard");
            return ResponseEntity.ok(ApiResponse.success("Revues en retard", riskService.getOverdueReviews()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    private void checkRole(User user, Set<String> allowedRoles, String action) {
        String userRole = user.getRole().name();
        // Allow ADMIN as fallback for system management
        if (!allowedRoles.contains(userRole) && !"ADMIN".equals(userRole)) {
            throw new RuntimeException("Rôle " + userRole + " non autorisé pour : " + action +
                ". Rôles autorisés : " + String.join(", ", allowedRoles));
        }
    }
}
