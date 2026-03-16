package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.DomainDevelopmentService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PRO_17 : Contrôleur pour le développement de domaines d'activité.
 */
@RestController
@RequestMapping("/api/domain-development")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class DomainDevelopmentController {

    private final DomainDevelopmentService domainDevService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> submitRequest(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            DomainDevelopmentRequest result = domainDevService.submitRequest(
                (String) body.get("domainName"), (String) body.get("description"),
                (String) body.get("regulatoryBasis"), (String) body.get("marketDemand"),
                (String) body.get("applicableStandards"), user);
            return ResponseEntity.ok(ApiResponse.success("Demande de développement soumise", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/feasibility/start")
    public ResponseEntity<?> startFeasibility(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Étude de faisabilité démarrée",
                domainDevService.startFeasibilityStudy(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/feasibility/complete")
    public ResponseEntity<?> completeFeasibility(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Étude de faisabilité terminée",
                domainDevService.completeFeasibility(id,
                    (String) body.get("feasibilityStudy"),
                    (Boolean) body.get("evaluatorsAvailable"),
                    body.get("evaluatorCount") != null ? ((Number) body.get("evaluatorCount")).intValue() : null,
                    (String) body.get("trainingPlan"),
                    (String) body.get("resourceRequirements"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/dt-review")
    public ResponseEntity<?> dtReview(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Revue DT effectuée",
                domainDevService.dtReview(id, (String) body.get("comments"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/dg-decision")
    public ResponseEntity<?> dgDecision(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Décision DG enregistrée",
                domainDevService.dgDecision(id, (Boolean) body.get("approved"),
                    (String) body.get("comments"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/implement")
    public ResponseEntity<?> implement(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Mise en œuvre démarrée",
                domainDevService.startImplementation(id, (String) body.get("notes"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Domaine activé",
                domainDevService.activateDomain(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Demandes de développement", domainDevService.getAllRequests()));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
