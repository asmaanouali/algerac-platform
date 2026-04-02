package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.*;
import com.algerac.repository.PreliminaryVisitRepository;
import com.algerac.repository.UserRepository;
import com.algerac.service.PreliminaryVisitService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Contrôleur pour la gestion de la Visite Préliminaire (optionnelle).
 * Processus : CD propose → OEC accepte/refuse → Programmation → Rapport (FOR 12)
 */
@RestController
@RequestMapping("/api/workflow/preliminary-visit")
@RequiredArgsConstructor
@Slf4j
public class PreliminaryVisitController {

    private final PreliminaryVisitService preliminaryVisitService;
    private final PreliminaryVisitRepository preliminaryVisitRepository;
    private final UserRepository userRepository;

    /**
     * CD propose une visite préliminaire pour une demande
     */
    @PostMapping("/{requestId}/propose")
    public ResponseEntity<?> proposeVisit(@PathVariable Long requestId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            PreliminaryVisit result = preliminaryVisitService.proposePreliminaryVisit(requestId, user);
            return ResponseEntity.ok(ApiResponse.success("Visite préliminaire proposée à l'OEC", result));
        } catch (Exception e) {
            log.error("Erreur proposition visite préliminaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC répond à la proposition de visite préliminaire (accepter/refuser)
     */
    @PostMapping("/{requestId}/respond")
    public ResponseEntity<?> respondToVisit(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            Boolean accepted = (Boolean) body.get("accepted");
            if (accepted == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le champ 'accepted' est requis"));
            }
            PreliminaryVisit result = preliminaryVisitService.respondToPreliminaryVisit(
                    requestId, accepted, user);
            String message = accepted
                    ? "Visite préliminaire acceptée"
                    : "Visite préliminaire refusée - le processus continue";
            return ResponseEntity.ok(ApiResponse.success(message, result));
        } catch (Exception e) {
            log.error("Erreur réponse visite préliminaire: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD programme la date de la visite préliminaire
     */
    @PostMapping("/{requestId}/schedule")
    public ResponseEntity<?> scheduleVisit(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            String visitDateStr = (String) body.get("visitDate");
            if (visitDateStr == null || visitDateStr.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("La date de visite est requise"));
            }
            LocalDateTime visitDate = LocalDateTime.parse(visitDateStr);
            if (visitDate.isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("La date de visite doit être dans le futur"));
            }
            PreliminaryVisit result = preliminaryVisitService.scheduleVisit(requestId, visitDate, user);
            return ResponseEntity.ok(ApiResponse.success("Visite préliminaire programmée", result));
        } catch (Exception e) {
            log.error("Erreur programmation visite: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * CD soumet le rapport de visite préliminaire (FOR 12)
     */
    @PostMapping("/{requestId}/report")
    public ResponseEntity<?> submitReport(@PathVariable Long requestId,
            @RequestBody Map<String, Object> body, HttpSession session) {
        try {
            User user = getSessionUser(session);
            String reportContent = (String) body.get("reportContent");
            if (reportContent == null || reportContent.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le contenu du rapport est requis"));
            }
            Integer estimatedDuration = body.get("estimatedDuration") != null
                    ? ((Number) body.get("estimatedDuration")).intValue()
                    : null;
            String obstaclesIdentified = (String) body.get("obstaclesIdentified");
            Boolean hasBlockingElements = body.get("hasBlockingElements") != null
                    ? (Boolean) body.get("hasBlockingElements")
                    : false;

            PreliminaryVisit result = preliminaryVisitService.submitReport(
                    requestId, reportContent, estimatedDuration,
                    obstaclesIdentified, hasBlockingElements, user);
            return ResponseEntity.ok(ApiResponse.success("Rapport de visite soumis", result));
        } catch (Exception e) {
            log.error("Erreur soumission rapport visite: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * OEC notifie la levée des obstacles bloquants
     */
    @PostMapping("/{requestId}/lift-obstacles")
    public ResponseEntity<?> liftObstacles(@PathVariable Long requestId, HttpSession session) {
        try {
            User user = getSessionUser(session);
            PreliminaryVisit result = preliminaryVisitService.liftObstacles(requestId, user);
            return ResponseEntity.ok(ApiResponse.success("Obstacles levés - processus reprend", result));
        } catch (Exception e) {
            log.error("Erreur levée obstacles: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Récupérer la visite préliminaire d'une demande
     */
    @GetMapping("/{requestId}")
    public ResponseEntity<?> getVisitByRequest(@PathVariable Long requestId) {
        return preliminaryVisitRepository.findByRequest_Id(requestId)
                .map(visit -> ResponseEntity.ok(ApiResponse.success("Visite trouvée", visit)))
                .orElse(ResponseEntity.ok(ApiResponse.success("Pas de visite préliminaire", null)));
    }

    /**
     * Vérifie si une visite préliminaire est en cours pour une demande
     */
    @GetMapping("/{requestId}/status")
    public ResponseEntity<?> getVisitStatus(@PathVariable Long requestId) {
        return preliminaryVisitRepository.findByRequest_Id(requestId)
                .map(visit -> {
                    Map<String, Object> status = Map.of(
                            "hasVisit", true,
                            "proposed", visit.getProposedByCD(),
                            "accepted", visit.getAcceptedByOEC() != null ? visit.getAcceptedByOEC() : false,
                            "scheduled", visit.getVisitDate() != null,
                            "reportSubmitted", visit.getReportFOR12() != null,
                            "hasBlockingElements", visit.getHasBlockingElements() != null ? visit.getHasBlockingElements() : false,
                            "obstaclesLifted", visit.getObstaclesLiftedDate() != null
                    );
                    return ResponseEntity.ok(ApiResponse.success("Statut visite", status));
                })
                .orElse(ResponseEntity.ok(ApiResponse.success("Pas de visite", Map.of("hasVisit", false))));
    }

    // ========== HELPER ==========

    private User getSessionUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new RuntimeException("Non authentifié");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
