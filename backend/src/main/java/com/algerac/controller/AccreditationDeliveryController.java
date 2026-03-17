package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.*;
import com.algerac.service.AccreditationDeliveryService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Contrôleur Phase III : Décision d'Accréditation et Délivrance (Étapes 9-12)
 */
@RestController
@RequestMapping("/api/workflow/accreditation")
@RequiredArgsConstructor
@Slf4j
public class AccreditationDeliveryController {

    private final AccreditationDeliveryService deliveryService;
    private final UserRepository userRepository;
    private final EvaluationReportRepository reportRepository;
    private final CASDecisionRepository casDecisionRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final SurveillancePlanRepository surveillancePlanRepository;
    private final CASMeetingRepository casMeetingRepository;

    // ========== ÉTAPE 9 : RAPPORT ==========

    @PostMapping("/{requestId}/report")
    public ResponseEntity<?> createReport(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationReport result = deliveryService.createEvaluationReport(
                requestId,
                body.get("type") != null ? ReportType.valueOf((String) body.get("type")) : ReportType.FOR_09_LABORATORY,
                (String) body.get("contextAndObjectives"),
                (String) body.get("teamComposition"),
                (String) body.get("programRealized"),
                (String) body.get("findingsByRequirement"),
                (String) body.get("gapsSummary"),
                (String) body.get("gapsStatus"),
                (String) body.get("strengths"),
                (String) body.get("improvementAreas"),
                (String) body.get("conclusion"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Rapport d'évaluation créé", result));
        } catch (Exception e) {
            log.error("Erreur création rapport: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/reports")
    public ResponseEntity<?> getReports(@PathVariable Long requestId) {
        List<EvaluationReport> reports = reportRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Rapports récupérés", reports));
    }

    @PostMapping("/reports/{reportId}/submit")
    public ResponseEntity<?> submitReport(@PathVariable Long reportId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationReport result = deliveryService.submitReportToCD(reportId, user);
            return ResponseEntity.ok(ApiResponse.success("Rapport soumis au CD", result));
        } catch (Exception e) {
            log.error("Erreur soumission rapport: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/reports/{reportId}/validate")
    public ResponseEntity<?> validateReport(@PathVariable Long reportId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationReport result = deliveryService.validateReport(
                reportId,
                (Boolean) body.get("validated"),
                (String) body.getOrDefault("correctionRequests", null),
                (String) body.getOrDefault("for23Content", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success(
                (Boolean) body.get("validated") ? "Rapport validé" : "Corrections demandées", result));
        } catch (Exception e) {
            log.error("Erreur validation rapport: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/reports/{reportId}/dt-validate")
    public ResponseEntity<?> dtValidateReport(@PathVariable Long reportId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationReport result = deliveryService.dtValidateReport(
                reportId, (Boolean) body.get("approved"), user);
            return ResponseEntity.ok(ApiResponse.success("Validation DT enregistrée", result));
        } catch (Exception e) {
            log.error("Erreur validation DT: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/reports/{reportId}/consolidation")
    public ResponseEntity<?> sendToConsolidation(@PathVariable Long reportId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            EvaluationReport result = deliveryService.sendToConsolidation(reportId, user);
            return ResponseEntity.ok(ApiResponse.success("Rapport envoyé en consolidation", result));
        } catch (Exception e) {
            log.error("Erreur consolidation: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 10 : CAS ==========

    @PostMapping("/{requestId}/cas-meeting")
    public ResponseEntity<?> scheduleCASMeeting(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            CASMeeting result = deliveryService.scheduleCASMeeting(
                requestId,
                LocalDateTime.parse((String) body.get("meetingDate")),
                (String) body.get("agenda"),
                (String) body.get("dossierSummary"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Réunion CAS programmée", result));
        } catch (Exception e) {
            log.error("Erreur programmation CAS: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/cas-meetings")
    public ResponseEntity<?> getCASMeetings(@PathVariable Long requestId) {
        List<CASMeeting> meetings = casMeetingRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Réunions CAS", meetings));
    }

    @PostMapping("/{requestId}/cas-decision")
    public ResponseEntity<?> recordCASDecision(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            CASDecision result = deliveryService.recordCASDecision(
                requestId,
                CASDecisionType.valueOf((String) body.get("decisionType")),
                (String) body.get("justification"),
                (String) body.get("scope"),
                (String) body.get("conditions"),
                (String) body.getOrDefault("reservesToLift", null),
                body.get("reservesDeadline") != null ? LocalDateTime.parse((String) body.get("reservesDeadline")) : null,
                (String) body.getOrDefault("refusalReason", null),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Décision CAS enregistrée", result));
        } catch (Exception e) {
            log.error("Erreur décision CAS: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/cas-decisions")
    public ResponseEntity<?> getCASDecisions(@PathVariable Long requestId) {
        List<CASDecision> decisions = casDecisionRepository.findByRequest_Id(requestId);
        return ResponseEntity.ok(ApiResponse.success("Décisions CAS", decisions));
    }

    // ========== ÉTAPE 11 : CERTIFICAT ==========

    @PostMapping("/{requestId}/certificate")
    public ResponseEntity<?> prepareCertificate(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationCertificate result = deliveryService.prepareCertificate(
                requestId,
                (String) body.get("oecIdentity"),
                (String) body.get("scope"),
                (String) body.get("technicalDomains"),
                (String) body.get("methodsAndStandards"),
                (String) body.get("concernedSites"),
                (String) body.getOrDefault("limitations", null),
                (String) body.get("accreditationStandardReference"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Certificat préparé", result));
        } catch (Exception e) {
            log.error("Erreur préparation certificat: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/{requestId}/certificate")
    public ResponseEntity<?> getCertificate(@PathVariable Long requestId) {
        return certificateRepository.findByRequest_Id(requestId)
            .map(cert -> ResponseEntity.ok(ApiResponse.success("Certificat", cert)))
            .orElse(ResponseEntity.ok(ApiResponse.success("Aucun certificat", null)));
    }

    @PutMapping("/certificates/{certId}/sign")
    public ResponseEntity<?> signCertificate(@PathVariable Long certId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            // Use session role (supports role switching) if available, fallback to DB role
            UserRole activeRole = (UserRole) session.getAttribute("userRole");
            if (activeRole == null) activeRole = user.getRole();
            AccreditationCertificate result = deliveryService.signCertificate(certId, activeRole);
            return ResponseEntity.ok(ApiResponse.success("Certificat signé", result));
        } catch (Exception e) {
            log.error("Erreur signature certificat: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/certificates/{certId}/publish")
    public ResponseEntity<?> publishCertificate(@PathVariable Long certId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationCertificate result = deliveryService.publishCertificate(
                certId,
                (String) body.get("certificateUrl"),
                (String) body.get("technicalAnnexUrl"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Certificat publié", result));
        } catch (Exception e) {
            log.error("Erreur publication certificat: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== ÉTAPE 12 : PLAN DE SURVEILLANCE ==========

    @PostMapping("/certificates/{certId}/surveillance-plan")
    public ResponseEntity<?> createSurveillancePlan(@PathVariable Long certId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillancePlan result = deliveryService.createSurveillancePlan(
                certId,
                (String) body.get("surveillanceCalendar"),
                (String) body.get("frequency"),
                (String) body.get("scopeSampling"),
                body.get("estimatedDuration") != null ? ((Number) body.get("estimatedDuration")).intValue() : null,
                body.get("firstSurveillanceDate") != null ?
                    LocalDateTime.parse((String) body.get("firstSurveillanceDate")) : null,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Plan de surveillance créé", result));
        } catch (Exception e) {
            log.error("Erreur création plan surveillance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/certificates/{certId}/surveillance-plan")
    public ResponseEntity<?> getSurveillancePlan(@PathVariable Long certId) {
        return surveillancePlanRepository.findByCertificate_Id(certId)
            .map(plan -> ResponseEntity.ok(ApiResponse.success("Plan de surveillance", plan)))
            .orElse(ResponseEntity.ok(ApiResponse.success("Aucun plan", null)));
    }

    @PostMapping("/surveillance-plans/{planId}/satisfaction-form")
    public ResponseEntity<?> sendSatisfactionForm(@PathVariable Long planId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillancePlan result = deliveryService.sendSatisfactionForm(planId, user);
            return ResponseEntity.ok(ApiResponse.success("Formulaire FOR 22 envoyé", result));
        } catch (Exception e) {
            log.error("Erreur envoi FOR 22: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/surveillance-plans/{planId}/satisfaction-feedback")
    public ResponseEntity<?> submitSatisfactionFeedback(@PathVariable Long planId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            SurveillancePlan result = deliveryService.submitSatisfactionFeedback(
                planId, (String) body.get("feedback"), user);
            return ResponseEntity.ok(ApiResponse.success("Retour de satisfaction enregistré", result));
        } catch (Exception e) {
            log.error("Erreur retour satisfaction: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== REFUS / AJOURNEMENT ==========

    @PostMapping("/{requestId}/process-refusal")
    public ResponseEntity<?> processRefusal(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationRequest result = deliveryService.processRefusal(
                requestId,
                (String) body.get("refusalDocuments"),
                (String) body.get("appealInstructions"),
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Refus traité", result));
        } catch (Exception e) {
            log.error("Erreur traitement refus: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{requestId}/process-postponement")
    public ResponseEntity<?> processPostponement(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            AccreditationRequest result = deliveryService.processPostponement(
                requestId,
                (String) body.get("additionalRequirements"),
                body.get("nextPresentationDate") != null ?
                    LocalDateTime.parse((String) body.get("nextPresentationDate")) : null,
                user
            );
            return ResponseEntity.ok(ApiResponse.success("Ajournement traité", result));
        } catch (Exception e) {
            log.error("Erreur traitement ajournement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ========== INFO COMPLÈTE ==========

    @GetMapping("/{requestId}/full-info")
    public ResponseEntity<?> getFullAccreditationInfo(@PathVariable Long requestId) {
        Map<String, Object> result = deliveryService.getCertificateWithSurveillanceInfo(requestId);
        return ResponseEntity.ok(ApiResponse.success("Informations complètes", result));
    }

    // ========== HELPER ==========

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
