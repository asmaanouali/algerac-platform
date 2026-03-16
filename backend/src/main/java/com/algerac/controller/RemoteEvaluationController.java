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
 */
@RestController
@RequestMapping("/api/remote-evaluation")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class RemoteEvaluationController {

    private final RemoteEvaluationService remoteEvalService;
    private final UserRepository userRepository;

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
                user);
            return ResponseEntity.ok(ApiResponse.success("Évaluation à distance proposée", eval));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

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

    @PutMapping("/{id}/verify-schedule")
    public ResponseEntity<?> verifyAndSchedule(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Vérification technique effectuée",
                remoteEvalService.verifyAndSchedule(id,
                    (Boolean) body.get("videoOk"), (Boolean) body.get("audioOk"),
                    (Boolean) body.get("docSharingOk"), (Boolean) body.get("connectionOk"),
                    (String) body.get("techPrereqs"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

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

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Évaluation terminée",
                remoteEvalService.completeEvaluation(id,
                    (String) body.get("findings"),
                    (Boolean) body.get("techDifficulties"), (String) body.get("techDetails"),
                    (Boolean) body.get("onsiteFollowUp"), (String) body.get("followUpReason"), user)));
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
