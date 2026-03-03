package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.*;
import com.algerac.service.SurveillanceService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Contrôleur Phase IV : Surveillance Périodique (Étapes 13-15)
 */
@RestController
@RequestMapping("/api/workflow/surveillance")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class SurveillanceController {

    private final SurveillanceService surveillanceService;
    private final UserRepository userRepository;
    private final SurveillanceEvaluationRepository survEvalRepository;
    private final RiskAnalysisFormRepository riskAnalysisRepository;

    // ========== ÉTAPE 13 : PROGRAMMATION ==========

    @PostMapping("/programme")
    public ResponseEntity<?> programmeSurveillance(@RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.programmeSurveillance(
                ((Number) body.get("certificateId")).longValue(),
                ((Number) body.get("requestId")).longValue(),
                body.get("plannedDate") != null ? LocalDateTime.parse((String) body.get("plannedDate")) : null,
                (String) body.get("scope"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Surveillance programmée", result));
        } catch (Exception e) {
            log.error("Erreur programmation surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/risk-analysis")
    public ResponseEntity<?> createRiskAnalysis(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            RiskAnalysisForm result = surveillanceService.createRiskAnalysis(
                survEvalId,
                getBool(body, "previousNonConformities"),
                (String) body.get("previousNCDetails"),
                getBool(body, "complaintsTreated"),
                (String) body.get("complaintsDetails"),
                getBool(body, "scopeChanges"),
                (String) body.get("scopeChangeDetails"),
                getBool(body, "organizationalChanges"),
                (String) body.get("orgChangeDetails"),
                getBool(body, "regulatoryChanges"),
                (String) body.get("regChangeDetails"),
                getBool(body, "satisfactionIssues"),
                (String) body.get("satisfactionDetails"),
                (String) body.get("overallRiskLevel"),
                (String) body.get("recommendedActions"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Analyse de risques FOR 77-1 créée", result));
        } catch (Exception e) {
            log.error("Erreur analyse de risques: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{survEvalId}/risk-analysis")
    public ResponseEntity<?> getRiskAnalysis(@PathVariable Long survEvalId) {
        SurveillanceEvaluation survEval = survEvalRepository.findById(survEvalId).orElse(null);
        RiskAnalysisForm form = survEval != null ? survEval.getRiskAnalysis() : null;
        return ResponseEntity.ok(ApiResponse.success("Analyse de risques", form));
    }

    @PostMapping("/{survEvalId}/request-documents")
    public ResponseEntity<?> requestDocumentsFromOEC(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.requestDocumentsFromOEC(
                survEvalId, (String) body.get("documentsRequested"), user);
            return ResponseEntity.ok(ApiResponse.success("Documents FOR 68 demandés", result));
        } catch (Exception e) {
            log.error("Erreur demande documents: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/submit-documents")
    public ResponseEntity<?> submitDocuments(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.submitDocuments(
                survEvalId, (String) body.get("documentsSubmitted"), user);
            return ResponseEntity.ok(ApiResponse.success("Documents soumis", result));
        } catch (Exception e) {
            log.error("Erreur soumission documents: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 14 : ÉVALUATION DE SURVEILLANCE ==========

    @PostMapping("/{survEvalId}/quotation")
    public ResponseEntity<?> prepareSurveillanceQuotation(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.prepareSurveillanceQuotation(
                survEvalId,
                (String) body.get("quotationDetails"),
                body.get("amount") != null ? ((Number) body.get("amount")).doubleValue() : null,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Devis surveillance préparé", result));
        } catch (Exception e) {
            log.error("Erreur préparation devis: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{survEvalId}/accept-quotation")
    public ResponseEntity<?> acceptQuotation(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.acceptQuotation(
                survEvalId,
                (Boolean) body.get("accepted"),
                (String) body.getOrDefault("rejectionReason", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success(
                (Boolean) body.get("accepted") ? "Devis accepté" : "Devis refusé", result));
        } catch (Exception e) {
            log.error("Erreur acceptation devis: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/team-plan")
    public ResponseEntity<?> prepareTeamAndPlan(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.prepareTeamAndPlan(
                survEvalId,
                body.get("teamId") != null ? ((Number) body.get("teamId")).longValue() : null,
                (String) body.get("evaluationPlanDetails"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Équipe et plan préparés", result));
        } catch (Exception e) {
            log.error("Erreur préparation équipe/plan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/start")
    public ResponseEntity<?> startSurveillanceEvaluation(@PathVariable Long survEvalId,
            HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.startSurveillanceEvaluation(survEvalId, user);
            return ResponseEntity.ok(ApiResponse.success("Évaluation de surveillance démarrée", result));
        } catch (Exception e) {
            log.error("Erreur démarrage surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/complete")
    public ResponseEntity<?> completeSurveillanceEvaluation(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.completeSurveillanceEvaluation(
                survEvalId,
                (String) body.get("findings"),
                (String) body.get("recommendation"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Évaluation de surveillance terminée", result));
        } catch (Exception e) {
            log.error("Erreur complétion surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{survEvalId}/validate-report")
    public ResponseEntity<?> validateSurveillanceReport(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillanceEvaluation result = surveillanceService.validateSurveillanceReport(
                survEvalId,
                (Boolean) body.get("validated"),
                (String) body.getOrDefault("corrections", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success(
                (Boolean) body.get("validated") ? "Rapport validé" : "Corrections demandées", result));
        } catch (Exception e) {
            log.error("Erreur validation rapport: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 15 : DÉCISION CAS SURVEILLANCE ==========

    @PostMapping("/{survEvalId}/cas-meeting")
    public ResponseEntity<?> scheduleCASMeeting(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            CASMeeting result = surveillanceService.scheduleSurveillanceCASMeeting(
                survEvalId,
                LocalDateTime.parse((String) body.get("meetingDate")),
                (String) body.get("agenda"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Réunion CAS surveillance programmée", result));
        } catch (Exception e) {
            log.error("Erreur programmation CAS surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{survEvalId}/cas-decision")
    public ResponseEntity<?> recordCASDecision(@PathVariable Long survEvalId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            CASDecision result = surveillanceService.recordSurveillanceCASDecision(
                survEvalId,
                CASDecisionType.valueOf((String) body.get("decisionType")),
                (String) body.get("justification"),
                (String) body.getOrDefault("scope", null),
                (String) body.getOrDefault("conditions", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Décision CAS surveillance enregistrée", result));
        } catch (Exception e) {
            log.error("Erreur décision CAS surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== SANCTIONS PRO 23 ==========

    @PostMapping("/{requestId}/suspend")
    public ResponseEntity<?> applySuspension(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationRequest result = surveillanceService.applySuspension(
                requestId,
                (String) body.get("reason"),
                body.get("suspensionEndDate") != null ?
                    LocalDateTime.parse((String) body.get("suspensionEndDate")) : null,
                (String) body.get("correctiveRequirements"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Suspension appliquée", result));
        } catch (Exception e) {
            log.error("Erreur suspension: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/withdraw")
    public ResponseEntity<?> applyWithdrawal(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationRequest result = surveillanceService.applyWithdrawal(
                requestId, (String) body.get("reason"), user);
            return ResponseEntity.ok(ApiResponse.success("Retrait d'accréditation appliqué", result));
        } catch (Exception e) {
            log.error("Erreur retrait: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/lift-suspension")
    public ResponseEntity<?> liftSuspension(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationRequest result = surveillanceService.liftSuspension(
                requestId, (String) body.get("verificationDetails"), user);
            return ResponseEntity.ok(ApiResponse.success("Suspension levée", result));
        } catch (Exception e) {
            log.error("Erreur levée suspension: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== CONSULTER ==========

    @GetMapping("/{survEvalId}")
    public ResponseEntity<?> getSurveillanceEvaluation(@PathVariable Long survEvalId) {
        return survEvalRepository.findById(survEvalId)
            .map(eval -> ResponseEntity.ok(ApiResponse.success("Surveillance", eval)))
            .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Surveillance non trouvée")));
    }

    @GetMapping("/certificate/{certificateId}/history")
    public ResponseEntity<?> getSurveillanceHistory(@PathVariable Long certificateId) {
        List<SurveillanceEvaluation> history = surveillanceService.getSurveillanceHistory(certificateId);
        return ResponseEntity.ok(ApiResponse.success("Historique surveillance", history));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingSurveillances() {
        List<SurveillanceEvaluation> upcoming = surveillanceService.getUpcomingSurveillances();
        return ResponseEntity.ok(ApiResponse.success("Surveillances à venir", upcoming));
    }

    @GetMapping("/overdue")
    public ResponseEntity<?> getOverdueSurveillances() {
        List<SurveillanceEvaluation> overdue = surveillanceService.getOverdueSurveillances();
        return ResponseEntity.ok(ApiResponse.success("Surveillances en retard", overdue));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getSurveillancesByRequest(@PathVariable Long requestId) {
        List<SurveillanceEvaluation> evals = survEvalRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Surveillances", evals));
    }

    // ========== HELPERS ==========

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    private Boolean getBool(Map<String, Object> body, String key) {
        Object val = body.get(key);
        return val != null ? (Boolean) val : false;
    }
}
