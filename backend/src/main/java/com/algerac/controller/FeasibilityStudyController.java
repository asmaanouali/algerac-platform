package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.FeasibilityDecisionDTO;
import com.algerac.model.FeasibilityDecision;
import com.algerac.model.FeasibilityStudy;
import com.algerac.model.User;
import com.algerac.repository.UserRepository;
import com.algerac.service.FeasibilityStudyService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feasibility-studies")
@RequiredArgsConstructor
public class FeasibilityStudyController {
    
    private final FeasibilityStudyService feasibilityStudyService;
    private final UserRepository userRepository;
    
    /**
     * RA: Démarrer une étude de faisabilité
     */
    @PostMapping("/start/{requestId}")
    public ResponseEntity<ApiResponse> startFeasibilityStudy(
            @PathVariable Long requestId,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            FeasibilityStudy study = feasibilityStudyService.startFeasibilityStudy(requestId, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Étude de faisabilité démarrée avec succès",
                    study
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Soumettre la décision de faisabilité
     */
    @PostMapping("/submit-decision/{requestId}")
    public ResponseEntity<ApiResponse> submitFeasibilityDecision(
            @PathVariable Long requestId,
            @Valid @RequestBody FeasibilityDecisionDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            FeasibilityStudy study = feasibilityStudyService.submitFeasibilityDecision(
                    requestId,
                    dto.getDecision(),
                    dto.getComments(),
                    dto.getTechnicalAnalysis(),
                    dto.getComplianceCheck(),
                    dto.getRejectionReason(),
                    currentUser
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Décision de faisabilité soumise avec succès",
                    study
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Obtenir l'étude de faisabilité pour une demande
     */
    @GetMapping("/by-request/{requestId}")
    public ResponseEntity<?> getFeasibilityStudyByRequest(@PathVariable Long requestId) {
        try {
            FeasibilityStudy study = feasibilityStudyService.getFeasibilityStudyByRequest(requestId);
            return ResponseEntity.ok(study);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Obtenir toutes mes études
     */
    @GetMapping("/my-studies")
    public ResponseEntity<?> getMyStudies(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        List<FeasibilityStudy> studies = feasibilityStudyService.getStudiesByRA(userId);
        return ResponseEntity.ok(studies);
    }
    
    /**
     * Obtenir les études par décision
     */
    @GetMapping("/by-decision/{decision}")
    public ResponseEntity<List<FeasibilityStudy>> getStudiesByDecision(
            @PathVariable FeasibilityDecision decision) {
        return ResponseEntity.ok(feasibilityStudyService.getStudiesByDecision(decision));
    }

    /**
     * RA: Sauvegarder le brouillon intermédiaire (reprise après déconnexion)
     */
    @PutMapping("/draft/{requestId}")
    public ResponseEntity<?> saveDraft(
            @PathVariable Long requestId,
            @RequestBody String draftJson,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        try {
            feasibilityStudyService.saveDraft(requestId, userId, draftJson);
            return ResponseEntity.ok(ApiResponse.success("Brouillon sauvegardé", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * RA: Récupérer le brouillon intermédiaire
     */
    @GetMapping("/draft/{requestId}")
    public ResponseEntity<?> getDraft(
            @PathVariable Long requestId,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        String draft = feasibilityStudyService.getDraft(requestId, userId);
        return ResponseEntity.ok(draft != null ? draft : "{}");
    }
}
