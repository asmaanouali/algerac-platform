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

/**
 * PRO_30 : Contrôleur pour la gestion des risques et opportunités.
 */
@RestController
@RequestMapping("/api/risks")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class RiskOpportunityController {

    private final RiskOpportunityService riskService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> identify(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            RiskOpportunityRegister result = riskService.identifyRisk(
                RiskType.valueOf((String) body.get("type")),
                (String) body.get("title"), (String) body.get("description"),
                RiskCategory.valueOf((String) body.get("category")),
                (String) body.get("source"),
                RiskLikelihood.valueOf((String) body.get("likelihood")),
                RiskImpact.valueOf((String) body.get("impact")),
                (String) body.get("department"), user);
            return ResponseEntity.ok(ApiResponse.success("Risque/Opportunité identifié(e)", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/treatment-plan")
    public ResponseEntity<?> treatmentPlan(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Plan de traitement défini",
                riskService.defineTreatmentPlan(id,
                    (String) body.get("mitigationActions"), (String) body.get("actionPlan"),
                    body.get("deadline") != null ? LocalDate.parse((String) body.get("deadline")) : null,
                    (String) body.get("keyIndicators"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/start-treatment")
    public ResponseEntity<?> startTreatment(@PathVariable Long id, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Traitement démarré", riskService.startTreatment(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Progrès mis à jour",
                riskService.updateProgress(id, (String) body.get("progressNotes"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Revue effectuée",
                riskService.performReview(id,
                    body.get("likelihood") != null ? RiskLikelihood.valueOf((String) body.get("likelihood")) : null,
                    body.get("impact") != null ? RiskImpact.valueOf((String) body.get("impact")) : null,
                    (String) body.get("reviewNotes"),
                    body.get("nextReview") != null ? LocalDate.parse((String) body.get("nextReview")) : null)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<?> close(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Clôturé",
                riskService.close(id, (String) body.get("residualNotes"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Registre", riskService.getAll()));
    }

    @GetMapping("/risks-only")
    public ResponseEntity<?> getRisks() {
        return ResponseEntity.ok(ApiResponse.success("Risques", riskService.getRisks()));
    }

    @GetMapping("/opportunities")
    public ResponseEntity<?> getOpportunities() {
        return ResponseEntity.ok(ApiResponse.success("Opportunités", riskService.getOpportunities()));
    }

    @GetMapping("/overdue-reviews")
    public ResponseEntity<?> getOverdue() {
        return ResponseEntity.ok(ApiResponse.success("Revues en retard", riskService.getOverdueReviews()));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
