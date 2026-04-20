package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.SamplingService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PRO_13-1 : Contrôleur pour la gestion des plans d'échantillonnage.
 * Gère les opérations CRUD et le workflow de validation.
 */
@RestController
@RequestMapping("/api/sampling")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class SamplingController {

    private final SamplingService samplingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.success("Plans", samplingService.getAllPlans()));
    }

    @GetMapping("/{planId}")
    public ResponseEntity<?> getPlanById(@PathVariable Long planId) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Plan", samplingService.getPlanById(planId)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success("Plans", samplingService.getPlansByRequest(requestId)));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingReview() {
        return ResponseEntity.ok(ApiResponse.success("Plans en attente", samplingService.getPendingReview()));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getByStatus(@PathVariable SamplingPlanStatus status) {
        return ResponseEntity.ok(ApiResponse.success("Plans", samplingService.getPlansByStatus(status)));
    }

    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            Long requestId = ((Number) body.get("requestId")).longValue();
            SamplingPlan plan = samplingService.createSamplingPlan(requestId, body, user);
            return ResponseEntity.ok(ApiResponse.success("Plan d'échantillonnage créé", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{planId}")
    public ResponseEntity<?> updatePlan(@PathVariable Long planId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.updatePlan(planId, body, user);
            return ResponseEntity.ok(ApiResponse.success("Plan mis à jour", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{planId}/submit")
    public ResponseEntity<?> submitToCD(@PathVariable Long planId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.submitToCD(planId, user);
            return ResponseEntity.ok(ApiResponse.success("Plan soumis au CD", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{planId}/review")
    public ResponseEntity<?> cdReview(@PathVariable Long planId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.cdReview(planId,
                (Boolean) body.get("approved"), (String) body.get("comments"), user);
            return ResponseEntity.ok(ApiResponse.success(
                (Boolean) body.get("approved") ? "Plan approuvé" : "Modifications demandées", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{planId}/apply")
    public ResponseEntity<?> applyPlan(@PathVariable Long planId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.applyPlan(planId, user);
            return ResponseEntity.ok(ApiResponse.success("Plan appliqué", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{planId}/archive")
    public ResponseEntity<?> archivePlan(@PathVariable Long planId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.archivePlan(planId, user);
            return ResponseEntity.ok(ApiResponse.success("Plan archivé", plan));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/calculate-scope-sample")
    public ResponseEntity<?> calculateScopeSample(
            @RequestParam int totalMethods, @RequestParam int assessmentsInCycle) {
        int recommended = samplingService.calculateRecommendedScopeSampleSize(totalMethods, assessmentsInCycle);
        return ResponseEntity.ok(ApiResponse.success("Taille recommandée", Map.of(
            "totalMethods", totalMethods,
            "assessmentsInCycle", assessmentsInCycle,
            "recommendedSampleSize", recommended
        )));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
