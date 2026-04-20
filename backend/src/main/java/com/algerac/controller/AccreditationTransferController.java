package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.UserRepository;
import com.algerac.service.AccreditationTransferService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * PRO_31 : Contrôleur pour le transfert d'accréditation.
 */
@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class AccreditationTransferController {

    private final AccreditationTransferService transferService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> initiate(@RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            Long sourceOecId = body.get("sourceOecId") != null
                ? ((Number) body.get("sourceOecId")).longValue()
                : user.getId();
            AccreditationTransfer transfer = transferService.initiateTransfer(
                ((Number) body.get("requestId")).longValue(),
                sourceOecId,
                (String) body.get("sourceOrgName"), (String) body.get("sourceOrgDetails"),
                (String) body.get("targetOrgName"), (String) body.get("targetOrgDetails"),
                body.get("targetIsNewEntity") != null ? (Boolean) body.get("targetIsNewEntity") : false,
                TransferReason.valueOf((String) body.get("reason")),
                (String) body.get("reasonDetails"),
                (String) body.get("transferredScope"),
                (Boolean) body.get("fullScope"),
                (String) body.get("scopeModifications"),
                (String) body.get("riskAnalysis"),
                body.get("impartialityCompliance") != null ? (Boolean) body.get("impartialityCompliance") : null,
                body.get("assessmentMethodsContinuity") != null ? (Boolean) body.get("assessmentMethodsContinuity") : null,
                (String) body.get("lastEvaluationStatus"),
                body.get("financialRegularized") != null ? (Boolean) body.get("financialRegularized") : null,
                user);
            return ResponseEntity.ok(ApiResponse.success("Transfert initié", transfer));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/documents")
    public ResponseEntity<?> submitDocuments(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            String attachedDocs = null;
            if (body.get("attachedDocuments") != null) {
                attachedDocs = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(body.get("attachedDocuments"));
            }
            return ResponseEntity.ok(ApiResponse.success("Documents soumis",
                transferService.submitDocuments(id,
                    (String) body.get("continuityAssessment"),
                    (Boolean) body.get("managementContinuity"),
                    (Boolean) body.get("personnelContinuity"),
                    (Boolean) body.get("equipmentContinuity"),
                    attachedDocs)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * PRO 31 §5.2 : Étude de faisabilité (FOR 86) par le CD
     */
    @PutMapping("/{id}/feasibility")
    public ResponseEntity<?> feasibilityStudy(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Étude de faisabilité enregistrée",
                transferService.conductFeasibilityStudy(id,
                    (String) body.get("feasibilityStudy"),
                    (String) body.get("feasibilityStudyRef"),
                    body.get("evaluationRequired") != null ? (Boolean) body.get("evaluationRequired") : false,
                    (String) body.get("findings"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/review")
    public ResponseEntity<?> review(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Examen effectué",
                transferService.review(id, (Boolean) body.get("evaluationRequired"),
                    (String) body.get("findings"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/evaluation")
    public ResponseEntity<?> recordEvaluation(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Évaluation enregistrée",
                transferService.recordEvaluationResult(id, (String) body.get("findings"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/decide")
    public ResponseEntity<?> decide(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Décision enregistrée",
                transferService.decide(id, (Boolean) body.get("approved"),
                    (String) body.get("justification"), user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/certificate")
    public ResponseEntity<?> issueCertificate(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Certificat émis",
                transferService.issueCertificate(id, ((Number) body.get("certificateId")).longValue())));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> complete(@PathVariable Long id, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Transfert complété",
                transferService.complete(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}/surveillance-plan")
    public ResponseEntity<?> updateSurveillancePlan(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            getSessionUser(session);
            return ResponseEntity.ok(ApiResponse.success("Plan de surveillance mis à jour",
                transferService.updateSurveillancePlan(id, (String) body.get("surveillancePlanRef"))));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Transferts", transferService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success("Transfert", transferService.getById(id)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyTransfers(HttpSession session) {
        User user = getSessionUser(session);
        return ResponseEntity.ok(ApiResponse.success("Mes transferts", transferService.getBySourceOec(user.getId())));
    }

    @GetMapping("/oec/{oecId}")
    public ResponseEntity<?> getByOec(@PathVariable Long oecId) {
        return ResponseEntity.ok(ApiResponse.success("Transferts OEC", transferService.getBySourceOec(oecId)));
    }

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new RuntimeException("Non authentifié");
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
