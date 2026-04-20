package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.RemoteEvaluationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * PRO_29 : Contrôleur pour les évaluations à distance.
 * Endpoints couvrant le workflow complet selon PRO 29 Rev02.
 */
@RestController
@RequestMapping("/api/remote-evaluation")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class RemoteEvaluationController {

    private final RemoteEvaluationService remoteEvalService;
    private final UserRepository userRepository;

    // ─── §5.2 Proposer une évaluation à distance ───────────────
    @PostMapping
    public ResponseEntity<?> propose(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            RemoteEvaluation eval = remoteEvalService.proposeRemoteEvaluation(
                ((Number) body.get("requestId")).longValue(),
                RemoteEvalJustification.valueOf((String) body.get("justification")),
                (String) body.get("justificationDetails"),
                (String) body.get("technologyPlatform"),
                (String) body.get("remoteScope"), (String) body.get("onsiteScope"),
                (Boolean) body.get("partialRemote"),
                body.get("startDate") != null ? LocalDateTime.parse((String) body.get("startDate")) : null,
                body.get("endDate") != null ? LocalDateTime.parse((String) body.get("endDate")) : null,
                body.get("durationHours") != null ? ((Number) body.get("durationHours")).intValue() : null,
                body.get("evaluationPhases") != null ? ((Number) body.get("evaluationPhases")).intValue() : 1,
                user);
            return ResponseEntity.ok(ApiResponse.success("Évaluation à distance proposée", eval));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.3 Soumettre l'analyse des risques (FOR 77-1) ──────
    @PutMapping("/{id}/risk-analysis")
    public ResponseEntity<?> submitRiskAnalysis(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Analyse des risques enregistrée",
                remoteEvalService.submitRiskAnalysis(id,
                    body.get("monthsSinceLastOnsite") != null ? ((Number) body.get("monthsSinceLastOnsite")).intValue() : null,
                    (Boolean) body.get("ictEquipmentAvailable"),
                    (String) body.get("ictEquipmentDetails"),
                    (Boolean) body.get("requirementsNatureSuitable"),
                    (Boolean) body.get("findingsNatureFollowable"),
                    (String) body.get("findingsDetails"),
                    (Boolean) body.get("complaintsToInvestigate"),
                    (String) body.get("complaintsDetails"),
                    (Boolean) body.get("safetyConstraintsAcceptable"),
                    (Boolean) body.get("cabResourcesStable"),
                    (Boolean) body.get("digitizationLevelAdequate"),
                    (Boolean) body.get("cabPerformanceSatisfactory"),
                    (Boolean) body.get("teamSizeAdequate"),
                    (Boolean) body.get("assessorRemoteExperience"),
                    (String) body.get("comments"),
                    user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.3 Approbation CD ──────────────────────────────────
    @PutMapping("/{id}/cd-approval")
    public ResponseEntity<?> cdApproval(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Décision CD enregistrée",
                remoteEvalService.cdApproval(id, (Boolean) body.get("approved"),
                    (String) body.get("comments"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.3 Consentement OEC ────────────────────────────────
    @PutMapping("/{id}/oec-consent")
    public ResponseEntity<?> oecConsent(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Consentement enregistré",
                remoteEvalService.oecConsent(id, (Boolean) body.get("consented"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.5 Vérification technique ─────────────────────────
    @PutMapping("/{id}/verify-technical")
    public ResponseEntity<?> verifyTechnical(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Vérification technique effectuée",
                remoteEvalService.verifyTechnical(id,
                    (Boolean) body.get("videoOk"), (Boolean) body.get("audioOk"),
                    (Boolean) body.get("docSharingOk"), (Boolean) body.get("connectionOk"),
                    (String) body.get("techPrereqs"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.3 & §5.4 Confidentialité + Planification ─────────
    @PutMapping("/{id}/confirm-schedule")
    public ResponseEntity<?> confirmAndSchedule(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Programmation confirmée",
                remoteEvalService.confirmConfidentialityAndSchedule(id,
                    body.get("startDate") != null ? LocalDateTime.parse((String) body.get("startDate")) : null,
                    body.get("endDate") != null ? LocalDateTime.parse((String) body.get("endDate")) : null,
                    user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-A Réunion d'ouverture ──────────────────────────
    @PutMapping("/{id}/opening-meeting")
    public ResponseEntity<?> openingMeeting(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Réunion d'ouverture démarrée",
                remoteEvalService.startOpeningMeeting(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-B Démarrer l'évaluation ────────────────────────
    @PutMapping("/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Évaluation démarrée",
                remoteEvalService.startEvaluation(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-B Signaler des difficultés ─────────────────────
    @PutMapping("/{id}/report-difficulties")
    public ResponseEntity<?> reportDifficulties(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Difficultés signalées",
                remoteEvalService.reportDifficulties(id, (String) body.get("details"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-C Réunion de clôture ───────────────────────────
    @PutMapping("/{id}/closing-meeting")
    public ResponseEntity<?> closingMeeting(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Réunion de clôture terminée",
                remoteEvalService.closingMeeting(id, (String) body.get("findings"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-C Envoi des fiches d'écarts ────────────────────
    @PutMapping("/{id}/send-deviation-sheets")
    public ResponseEntity<?> sendDeviationSheets(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Fiches d'écarts envoyées",
                remoteEvalService.sendDeviationSheets(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-C Réception documents OEC ──────────────────────
    @PutMapping("/{id}/receive-oec-documents")
    public ResponseEntity<?> receiveOecDocuments(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Documents OEC reçus",
                remoteEvalService.receiveOecDocuments(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-D&E Finaliser (traçabilité + soumission CAS) ──
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Évaluation finalisée",
                remoteEvalService.completeEvaluation(id,
                    (String) body.get("ictUsageDescription"),
                    (String) body.get("ictEffectivenessAssessment"),
                    (Boolean) body.get("onsiteFollowUp"),
                    (String) body.get("followUpReason"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.6-E Décision CAS ─────────────────────────────────
    @PutMapping("/{id}/cas-decision")
    public ResponseEntity<?> casDecision(@PathVariable Long id, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Décision CAS enregistrée",
                remoteEvalService.recordCasDecision(id, user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── §5.7 Non réalisable ─────────────────────────────────
    @PutMapping("/{id}/not-feasible")
    public ResponseEntity<?> notFeasible(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Marquée non réalisable",
                remoteEvalService.markNotFeasible(id,
                    (String) body.get("reason"),
                    (Boolean) body.get("deskReview"),
                    (Boolean) body.get("conferenceCall"),
                    body.get("onsitePlannedDate") != null ? LocalDateTime.parse((String) body.get("onsitePlannedDate")) : null,
                    user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── Annuler / Reporter ──────────────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Évaluation annulée",
                remoteEvalService.cancel(id, (String) body.get("reason"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ─── Lecture ─────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Évaluation", remoteEvalService.getById(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<?> getByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success("Évaluations", remoteEvalService.getByRequest(requestId)));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Toutes les évaluations", remoteEvalService.getAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActive() {
        return ResponseEntity.ok(ApiResponse.success("Évaluations actives", remoteEvalService.getActive()));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
