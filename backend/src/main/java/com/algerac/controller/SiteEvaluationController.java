package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.*;
import com.algerac.service.SiteEvaluationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Contrôleur Phase II : Évaluation sur Site (Étapes 6-8)
 */
@RestController
@RequestMapping("/api/workflow/site-evaluation")
@RequiredArgsConstructor
@Slf4j
public class SiteEvaluationController {

    private final SiteEvaluationService siteEvaluationService;
    private final UserRepository userRepository;
    private final GapRepository gapRepository;
    private final GapContestationRepository contestationRepository;
    private final ComplementaryEvaluationRepository compEvalRepository;
    private final ActionPlanRepository actionPlanRepository;

    // ========== ÉTAPE 6 : PRÉPARATION ==========

    @PostMapping("/{requestId}/mandate")
    public ResponseEntity<?> sendTeamMandate(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            String mandateDetails = (String) body.get("mandateDetails");
            AccreditationRequest result = siteEvaluationService.sendTeamMandate(requestId, mandateDetails, user);
            return ResponseEntity.ok(ApiResponse.success("Mandatement envoyé à l'équipe", result));
        } catch (Exception e) {
            log.error("Erreur mandatement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/mission-orders")
    public ResponseEntity<?> createMissionOrders(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> orderDetails = (List<Map<String, Object>>) body.get("orders");
            List<MissionOrder> result = siteEvaluationService.createMissionOrderRequests(requestId, orderDetails, user);
            return ResponseEntity.ok(ApiResponse.success(result.size() + " ordres de mission créés", result));
        } catch (Exception e) {
            log.error("Erreur création ordres de mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/mission-orders/{orderId}/validate")
    public ResponseEntity<?> validateMissionOrder(@PathVariable Long orderId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            boolean approved = (Boolean) body.get("approved");
            String adjustmentReason = (String) body.getOrDefault("adjustmentReason", null);
            MissionOrder result = siteEvaluationService.validateMissionOrder(orderId, approved, adjustmentReason, user);
            return ResponseEntity.ok(ApiResponse.success(
                approved ? "Ordre de mission approuvé" : "Ajustement demandé", result));
        } catch (Exception e) {
            log.error("Erreur validation ordre de mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/send-mission-orders")
    public ResponseEntity<?> sendMissionOrdersToTeam(@PathVariable Long requestId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            siteEvaluationService.sendMissionOrdersToTeam(requestId, user);
            return ResponseEntity.ok(ApiResponse.success("Ordres de mission transmis à l'équipe", null));
        } catch (Exception e) {
            log.error("Erreur transmission ordres de mission: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/evaluation-plan")
    public ResponseEntity<?> createEvaluationPlan(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationPlan result = siteEvaluationService.createEvaluationPlan(
                requestId,
                (String) body.get("dailyProgram"),
                (String) body.get("activityDistribution"),
                (String) body.get("schedules"),
                (String) body.get("documentsToExamine"),
                body.get("evaluationDate") != null ? LocalDateTime.parse((String) body.get("evaluationDate")) : null,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Plan d'évaluation créé", result));
        } catch (Exception e) {
            log.error("Erreur création plan d'évaluation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/evaluation-plan/{planId}/validate")
    public ResponseEntity<?> validateEvaluationPlan(@PathVariable Long planId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            boolean approved = (Boolean) body.get("approved");
            String adjustments = (String) body.getOrDefault("adjustments", null);
            EvaluationPlan result = siteEvaluationService.validateEvaluationPlan(planId, approved, adjustments, user);
            return ResponseEntity.ok(ApiResponse.success(
                approved ? "Plan d'évaluation validé" : "Ajustements demandés", result));
        } catch (Exception e) {
            log.error("Erreur validation plan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/evaluation-plan/{planId}/send-oec")
    public ResponseEntity<?> sendPlanToOEC(@PathVariable Long planId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationPlan result = siteEvaluationService.sendPlanToOEC(planId, user);
            return ResponseEntity.ok(ApiResponse.success("Plan d'évaluation envoyé à l'OEC", result));
        } catch (Exception e) {
            log.error("Erreur envoi plan à l'OEC: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 7 : ÉVALUATION TERRAIN ==========

    @PostMapping("/{requestId}/opening-meeting")
    public ResponseEntity<?> createOpeningMeeting(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationNote result = siteEvaluationService.createOpeningMeetingNote(
                requestId,
                (String) body.get("attendees"),
                (String) body.get("openingDetails"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Réunion d'ouverture démarrée", result));
        } catch (Exception e) {
            log.error("Erreur réunion d'ouverture: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/evaluator-note")
    public ResponseEntity<?> createEvaluatorNote(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationNote result = siteEvaluationService.createEvaluatorNote(
                requestId,
                (String) body.getOrDefault("noteType", "EVALUATION"),
                (String) body.get("observations"),
                (String) body.get("synthesis"),
                (String) body.get("checklistStatus"),
                body.get("role") != null ? TeamRole.valueOf((String) body.get("role")) : TeamRole.ET,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Note d'évaluation créée", result));
        } catch (Exception e) {
            log.error("Erreur note d'évaluation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/gap")
    public ResponseEntity<?> createGap(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            Gap result = siteEvaluationService.createGapFOR02(
                requestId,
                GapType.valueOf((String) body.get("type")),
                (String) body.get("description"),
                (String) body.get("requirement"),
                (String) body.get("evidence"),
                (String) body.get("for02Content"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Écart FOR 02 créé", result));
        } catch (Exception e) {
            log.error("Erreur création écart: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/consensus")
    public ResponseEntity<?> createConsensus(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationNote result = siteEvaluationService.createConsensusNote(
                requestId,
                (String) body.get("consensusDetails"),
                (Boolean) body.getOrDefault("consensusReached", true),
                (String) body.getOrDefault("cdArbitration", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Consensus enregistré", result));
        } catch (Exception e) {
            log.error("Erreur consensus: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/closing-meeting")
    public ResponseEntity<?> createClosingMeeting(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationNote result = siteEvaluationService.createClosingMeetingNote(
                requestId,
                (String) body.get("closingDetails"),
                (String) body.get("generalResults"),
                (String) body.get("strengths"),
                (String) body.get("improvements"),
                (String) body.get("gapConsequences"),
                (String) body.get("appealRights"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Réunion de clôture terminée", result));
        } catch (Exception e) {
            log.error("Erreur réunion de clôture: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/transmit-closing-docs")
    public ResponseEntity<?> transmitClosingDocuments(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            siteEvaluationService.transmitClosingDocuments(
                requestId,
                (String) body.get("attendanceSheets"),
                (String) body.get("missionOrderRefs"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Documents de clôture transmis", null));
        } catch (Exception e) {
            log.error("Erreur transmission documents: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 8 : TRAITEMENT DES ÉCARTS ==========

    @GetMapping("/{requestId}/gaps")
    public ResponseEntity<?> getGaps(@PathVariable Long requestId) {
        List<Gap> gaps = gapRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Écarts récupérés", gaps));
    }

    @PostMapping("/{requestId}/request-action-plans")
    public ResponseEntity<?> requestActionPlans(@PathVariable Long requestId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            siteEvaluationService.requestActionPlans(requestId, user);
            return ResponseEntity.ok(ApiResponse.success("Plans d'action demandés à l'OEC", null));
        } catch (Exception e) {
            log.error("Erreur demande plans d'action: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/gaps/{gapId}/action-plan")
    public ResponseEntity<?> submitActionPlan(@PathVariable Long gapId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            ActionPlan result = siteEvaluationService.submitActionPlan(
                gapId,
                (String) body.get("correctiveActions"),
                (String) body.get("preventiveActions"),
                (String) body.get("responsiblePerson"),
                body.get("deadline") != null ? LocalDateTime.parse((String) body.get("deadline")) : null,
                (String) body.get("supportingDocuments"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Plan d'action soumis", result));
        } catch (Exception e) {
            log.error("Erreur soumission plan d'action: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/gaps/{gapId}/evaluate-plan")
    public ResponseEntity<?> evaluateActionPlan(@PathVariable Long gapId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            ActionPlan result = siteEvaluationService.evaluateActionPlan(
                gapId,
                (Boolean) body.get("accepted"),
                (String) body.get("feedback"),
                (String) body.getOrDefault("rejectionReason", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success(
                (Boolean) body.get("accepted") ? "Plan accepté" : "Plan rejeté", result));
        } catch (Exception e) {
            log.error("Erreur évaluation plan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/gaps/{gapId}/evidence")
    public ResponseEntity<?> submitEvidence(@PathVariable Long gapId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            ActionPlan result = siteEvaluationService.submitImplementationEvidence(
                gapId,
                (String) body.get("evidence"),
                body.get("completedDate") != null ? LocalDateTime.parse((String) body.get("completedDate")) : null,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Preuves soumises", result));
        } catch (Exception e) {
            log.error("Erreur soumission preuves: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/gaps/{gapId}/verify-evidence")
    public ResponseEntity<?> verifyEvidence(@PathVariable Long gapId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            ActionPlan result = siteEvaluationService.verifyEvidence(
                gapId,
                (Boolean) body.get("satisfactory"),
                (String) body.get("feedback"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Vérification effectuée", result));
        } catch (Exception e) {
            log.error("Erreur vérification preuves: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== CONTESTATIONS ==========

    @PostMapping("/gaps/{gapId}/contest")
    public ResponseEntity<?> contestGap(@PathVariable Long gapId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            GapContestation result = siteEvaluationService.contestGap(
                gapId, (String) body.get("reason"), user);
            return ResponseEntity.ok(ApiResponse.success("Contestation déposée", result));
        } catch (Exception e) {
            log.error("Erreur contestation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/contestations/{contestationId}/designate-examiner")
    public ResponseEntity<?> designateExaminer(@PathVariable Long contestationId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            Long examinerId = ((Number) body.get("examinerId")).longValue();
            GapContestation result = siteEvaluationService.designateContestationExaminer(
                contestationId, examinerId, user);
            return ResponseEntity.ok(ApiResponse.success("Examinateur désigné", result));
        } catch (Exception e) {
            log.error("Erreur désignation examinateur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/contestations/{contestationId}/resolve")
    public ResponseEntity<?> resolveContestation(@PathVariable Long contestationId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            GapContestation result = siteEvaluationService.resolveContestation(
                contestationId,
                (Boolean) body.get("founded"),
                (String) body.get("findings"),
                (String) body.get("decision"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Contestation résolue", result));
        } catch (Exception e) {
            log.error("Erreur résolution contestation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/contestations/{contestationId}/escalate-cas")
    public ResponseEntity<?> escalateToCAS(@PathVariable Long contestationId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            GapContestation result = siteEvaluationService.escalateContestationToCAS(contestationId, user);
            return ResponseEntity.ok(ApiResponse.success("Contestation escaladée au CAS", result));
        } catch (Exception e) {
            log.error("Erreur escalade CAS: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/contestations")
    public ResponseEntity<?> getContestations(@PathVariable Long requestId) {
        List<GapContestation> contestations = contestationRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Contestations récupérées", contestations));
    }

    // ========== ÉVALUATION COMPLÉMENTAIRE ==========

    @PostMapping("/{requestId}/complementary-evaluation")
    public ResponseEntity<?> decideComplementaryEval(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            boolean needed = (Boolean) body.get("needed");
            ComplementaryEvaluation result = siteEvaluationService.decideComplementaryEvaluation(
                requestId, needed, user);
            return ResponseEntity.ok(ApiResponse.success(
                needed ? "Évaluation complémentaire décidée" : "Pas d'évaluation complémentaire", result));
        } catch (Exception e) {
            log.error("Erreur évaluation complémentaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/complementary-evaluations")
    public ResponseEntity<?> getComplementaryEvaluations(@PathVariable Long requestId) {
        List<ComplementaryEvaluation> evals = compEvalRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Évaluations complémentaires", evals));
    }

    // ========== DEADLINE CHECKING ==========

    @GetMapping("/{requestId}/deadline-check")
    public ResponseEntity<?> checkDeadline(@PathVariable Long requestId) {
        Map<String, Object> result = siteEvaluationService.checkGlobalDeadline(requestId);
        return ResponseEntity.ok(ApiResponse.success("Vérification délai", result));
    }

    @GetMapping("/gaps/{gapId}/action-plan")
    public ResponseEntity<?> getActionPlan(@PathVariable Long gapId) {
        return actionPlanRepository.findByGap_Id(gapId)
            .map(plan -> ResponseEntity.ok(ApiResponse.success("Plan d'action", plan)))
            .orElse(ResponseEntity.ok(ApiResponse.success("Aucun plan d'action", null)));
    }

    // ========== HELPER ==========

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
