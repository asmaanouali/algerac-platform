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
 */
@RestController
@RequestMapping("/api/sampling")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class SamplingController {

    private final SamplingService samplingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SamplingPlan plan = samplingService.createSamplingPlan(
                ((Number) body.get("requestId")).longValue(),
                SamplingPlanType.valueOf((String) body.get("planType")),
                (String) body.get("methodology"),
                body.get("totalMethods") != null ? ((Number) body.get("totalMethods")).intValue() : null,
                body.get("selectedMethods") != null ? ((Number) body.get("selectedMethods")).intValue() : null,
                (String) body.get("selectedMethodsDetail"),
                body.get("totalSites") != null ? ((Number) body.get("totalSites")).intValue() : null,
                body.get("selectedSites") != null ? ((Number) body.get("selectedSites")).intValue() : null,
                (String) body.get("selectedSitesDetail"),
                (String) body.get("selectionCriteria"),
                (String) body.get("riskFactors"),
                (String) body.get("justification"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Plan d'échantillonnage créé", plan));
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

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success("Plans", samplingService.getPlansByRequest(requestId)));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
