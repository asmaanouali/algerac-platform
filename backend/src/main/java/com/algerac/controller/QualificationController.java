package com.algerac.controller;

import com.algerac.model.*;
import com.algerac.service.QualificationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qualifications")
@RequiredArgsConstructor
@Slf4j
public class QualificationController {

    private final QualificationService qualificationService;

    // ==================== AUTH CHECK ====================

    private Long getAuthenticatedUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userId;
    }

    // ==================== QUALIFICATIONS ====================

    @GetMapping
    public ResponseEntity<?> getAllQualifications(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getAllQualifications());
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des qualifications", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getQualificationById(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getQualificationById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/evaluator/{evaluatorId}")
    public ResponseEntity<?> getQualificationsByEvaluator(@PathVariable Long evaluatorId, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getQualificationsByEvaluator(evaluatorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getQualificationsByStatus(@PathVariable QualificationStatus status, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getQualificationsByStatus(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveQualifications(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getActiveQualifications());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/expiring")
    public ResponseEntity<?> getExpiringQualifications(
            @RequestParam(defaultValue = "90") int days, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getExpiringQualifications(days));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/expired")
    public ResponseEntity<?> getExpiredQualifications(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getExpiredQualifications());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createQualification(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Long evaluatorId = Long.valueOf(body.get("evaluatorId").toString());
            TeamRole qualifiedRole = TeamRole.valueOf((String) body.get("qualifiedRole"));
            String standardsJson = (String) body.get("qualifiedStandardsJson");
            String domainsJson = (String) body.get("qualifiedDomainsJson");
            Boolean fromOtherBody = (Boolean) body.get("fromOtherAccreditationBody");
            String sourceBody = (String) body.get("sourceAccreditationBody");
            return ResponseEntity.ok(qualificationService.createQualification(
                    evaluatorId, qualifiedRole, standardsJson, domainsJson, fromOtherBody, sourceBody));
        } catch (Exception e) {
            log.error("Erreur lors de la création de la qualification", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateQualificationStatus(
            @PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            QualificationStatus newStatus = QualificationStatus.valueOf(body.get("status"));
            return ResponseEntity.ok(qualificationService.updateQualificationStatus(id, newStatus));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/training-result")
    public ResponseEntity<?> recordTrainingResult(
            @PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Double score = Double.valueOf(body.get("examScore").toString());
            return ResponseEntity.ok(qualificationService.recordTrainingResult(id, score));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/advance-observer")
    public ResponseEntity<?> advanceToObserverPhase(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.advanceToObserverPhase(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/advance-practice")
    public ResponseEntity<?> advanceToPracticePhase(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.advanceToPracticePhase(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/increment-observer")
    public ResponseEntity<?> incrementObserverMissions(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.incrementObserverMissions(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/increment-supervised")
    public ResponseEntity<?> incrementSupervisedMissions(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.incrementSupervisedMissions(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/submit-commission")
    public ResponseEntity<?> submitToCommission(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.submitToCommission(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/commission-decision")
    public ResponseEntity<?> applyCommissionDecision(
            @PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            QualificationDecisionType decision = QualificationDecisionType.valueOf((String) body.get("decision"));
            Long commissionId = body.get("commissionId") != null ?
                    Long.valueOf(body.get("commissionId").toString()) : null;
            String notes = (String) body.get("notes");
            return ResponseEntity.ok(qualificationService.applyCommissionDecision(id, decision, commissionId, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/sign-contract")
    public ResponseEntity<?> signCollaborationContract(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.signCollaborationContract(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/record-mission")
    public ResponseEntity<?> recordMissionCompleted(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.recordMissionCompleted(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/record-recycling")
    public ResponseEntity<?> recordRecyclingParticipation(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.recordRecyclingParticipation(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== OBSERVATION REPORTS (FOR 71) ====================

    @GetMapping("/observations")
    public ResponseEntity<?> getAllObservationReports(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getAllObservationReports());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/observations/{id}")
    public ResponseEntity<?> getObservationReportById(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getObservationReportById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/observations/evaluator/{evaluatorId}")
    public ResponseEntity<?> getObservationsByEvaluator(@PathVariable Long evaluatorId, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getObservationsByEvaluator(evaluatorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/observations")
    public ResponseEntity<?> createObservationReport(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Long evaluatorId = Long.valueOf(body.get("evaluatorId").toString());
            Long observerId = Long.valueOf(body.get("observerId").toString());
            Long requestId = body.get("requestId") != null ?
                    Long.valueOf(body.get("requestId").toString()) : null;
            Long qualificationId = body.get("qualificationId") != null ?
                    Long.valueOf(body.get("qualificationId").toString()) : null;
            return ResponseEntity.ok(qualificationService.createObservationReport(
                    evaluatorId, observerId, requestId, qualificationId, body));
        } catch (Exception e) {
            log.error("Erreur lors de la création de la fiche d'observation", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== OEC SATISFACTION (FOR 21) ====================

    @GetMapping("/satisfaction")
    public ResponseEntity<?> getAllSatisfactionSurveys(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getAllSatisfactionSurveys());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/satisfaction/evaluator/{evaluatorId}")
    public ResponseEntity<?> getSatisfactionByEvaluator(@PathVariable Long evaluatorId, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getSatisfactionByEvaluator(evaluatorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/satisfaction")
    public ResponseEntity<?> createSatisfactionSurvey(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Long requestId = body.get("requestId") != null ?
                    Long.valueOf(body.get("requestId").toString()) : null;
            Long oecUserId = Long.valueOf(body.get("oecUserId").toString());
            Long evaluatorId = body.get("evaluatorId") != null ?
                    Long.valueOf(body.get("evaluatorId").toString()) : null;
            return ResponseEntity.ok(qualificationService.createSatisfactionSurvey(
                    requestId, oecUserId, evaluatorId, body));
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'enquête de satisfaction", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== COMMISSION DE QUALIFICATION ====================

    @GetMapping("/commissions")
    public ResponseEntity<?> getAllCommissions(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getAllCommissions());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/commissions/{id}")
    public ResponseEntity<?> getCommissionById(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getCommissionById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/commissions")
    public ResponseEntity<?> createCommission(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.createCommission(body));
        } catch (Exception e) {
            log.error("Erreur lors de la création de la commission", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/commissions/{id}/convocation")
    public ResponseEntity<?> sendConvocation(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.sendConvocation(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/commissions/{id}/start-session")
    public ResponseEntity<?> startSession(@PathVariable Long id, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.startSession(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/commissions/{id}/complete")
    public ResponseEntity<?> completeCommission(@PathVariable Long id,
                                                 @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            String minutesText = (String) body.get("minutesText");
            String decisionsJson = (String) body.get("decisionsJson");
            String participantsJson = (String) body.get("participantsJson");
            return ResponseEntity.ok(qualificationService.completeCommission(
                    id, minutesText, decisionsJson, participantsJson));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== TRAINING RECORDS ====================

    @GetMapping("/training/evaluator/{evaluatorId}")
    public ResponseEntity<?> getTrainingByEvaluator(@PathVariable Long evaluatorId, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getTrainingByEvaluator(evaluatorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/training")
    public ResponseEntity<?> createTrainingRecord(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Long evaluatorId = Long.valueOf(body.get("evaluatorId").toString());
            return ResponseEntity.ok(qualificationService.createTrainingRecord(evaluatorId, body));
        } catch (Exception e) {
            log.error("Erreur lors de la création de l'enregistrement de formation", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/training/{id}/exam-result")
    public ResponseEntity<?> recordExamResult(@PathVariable Long id,
                                               @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            Double score = Double.valueOf(body.get("score").toString());
            return ResponseEntity.ok(qualificationService.recordExamResult(id, score));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================== STATISTICS ====================

    @GetMapping("/stats")
    public ResponseEntity<?> getQualificationStats(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getQualificationStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/directory")
    public ResponseEntity<?> getEvaluatorDirectory(HttpSession session) {
        try {
            getAuthenticatedUserId(session);
            return ResponseEntity.ok(qualificationService.getEvaluatorDirectory());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
