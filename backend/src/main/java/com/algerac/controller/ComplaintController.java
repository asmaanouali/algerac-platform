package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.Complaint;
import com.algerac.model.ComplaintStatus;
import com.algerac.model.UserRole;
import com.algerac.service.ComplaintService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Slf4j
public class ComplaintController {

    private final ComplaintService complaintService;

    /**
     * Submit a public complaint (no authentication required)
     */
    @PostMapping("/public")
    public ResponseEntity<ApiResponse> submitPublicComplaint(@RequestBody Map<String, Object> data) {
        log.info("[COMPLAINT] Public complaint submission received");
        try {
            Complaint complaint = complaintService.submitPublicComplaint(data);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Votre plainte a été enregistrée avec succès.",
                            Map.of(
                                    "id", complaint.getId(),
                                    "trackingCode", complaint.getTrackingCode(),
                                    "status", complaint.getStatus().name()
                            )
                    ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error submitting public complaint: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'enregistrement de la plainte: " + e.getMessage()));
        }
    }

    /**
     * Submit an internal complaint (authenticated users)
     */
    @PostMapping
    public ResponseEntity<ApiResponse> submitInternalComplaint(
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        log.info("[COMPLAINT] Internal complaint from user {}", userId);
        try {
            Complaint complaint = complaintService.submitInternalComplaint(userId, data);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(
                            "Votre plainte a été enregistrée et transmise au Responsable Qualité.",
                            Map.of(
                                    "id", complaint.getId(),
                                    "trackingCode", complaint.getTrackingCode(),
                                    "status", complaint.getStatus().name()
                            )
                    ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error submitting internal complaint: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur lors de l'enregistrement: " + e.getMessage()));
        }
    }

    /**
     * Get all complaints (RQ role only)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllComplaints(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès réservé au Responsable Qualité"));
        }

        List<Complaint> complaints = complaintService.getAllComplaints();
        return ResponseEntity.ok(ApiResponse.success("Plaintes récupérées", complaints));
    }

    /**
     * Get current user's complaints
     */
    @GetMapping("/mine")
    public ResponseEntity<?> getMyComplaints(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        List<Complaint> complaints = complaintService.getComplaintsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Vos plaintes", complaints));
    }

    /**
     * Make a decision on a complaint (RQ only)
     */
    @PostMapping("/{id}/decision")
    public ResponseEntity<ApiResponse> makeDecision(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Seul le Responsable Qualité peut prendre une décision"));
        }

        log.info("[COMPLAINT] Decision on complaint {} by user {}", id, userId);
        try {
            Complaint complaint = complaintService.makeDecision(id, data);
            return ResponseEntity.ok(ApiResponse.success(
                    "Décision enregistrée pour la plainte " + complaint.getTrackingCode(),
                    Map.of(
                            "id", complaint.getId(),
                            "trackingCode", complaint.getTrackingCode(),
                            "status", complaint.getStatus().name(),
                            "decisionDate", complaint.getDecisionDate().toString()
                    )
            ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error making decision on complaint {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur: " + e.getMessage()));
        }
    }

    /**
     * Get complaint statistics (for RQ dashboard) - optimized with repository counts
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getComplaintStats(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès réservé au Responsable Qualité"));
        }

        List<Complaint> all = complaintService.getAllComplaints();
        long total = all.size();
        long received = all.stream().filter(c -> c.getStatus() == ComplaintStatus.RECEIVED).count();
        long underReview = all.stream().filter(c -> c.getStatus() == ComplaintStatus.UNDER_REVIEW).count();
        long assigned = all.stream().filter(c -> c.getStatus() == ComplaintStatus.ASSIGNED).count();
        long investigation = all.stream().filter(c -> c.getStatus() == ComplaintStatus.INVESTIGATION).count();
        long founded = all.stream().filter(c -> c.getStatus() == ComplaintStatus.FOUNDED).count();
        long unfounded = all.stream().filter(c -> c.getStatus() == ComplaintStatus.UNFOUNDED).count();
        long correctiveActions = all.stream().filter(c -> c.getStatus() == ComplaintStatus.CORRECTIVE_ACTIONS).count();
        long resolved = all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();
        long closed = all.stream().filter(c -> c.getStatus() == ComplaintStatus.CLOSED).count();
        long publicCount = all.stream().filter(c -> Boolean.TRUE.equals(c.getIsPublic())).count();
        long internalCount = all.stream().filter(c -> !Boolean.TRUE.equals(c.getIsPublic())).count();

        // Deadline info
        Map<String, List<Complaint>> deadlineAlerts = complaintService.getDeadlineAlerts();

        return ResponseEntity.ok(ApiResponse.success("Statistiques", Map.of(
                "total", total,
                "received", received,
                "underReview", underReview,
                "assigned", assigned,
                "investigation", investigation,
                "founded", founded,
                "unfounded", unfounded,
                "correctiveActions", correctiveActions,
                "resolved", resolved,
                "closed", closed,
                "public", publicCount,
                "internal", internalCount,
                "overdueCount", deadlineAlerts.get("overdue").size(),
                "approachingDeadlineCount", deadlineAlerts.get("approaching").size()
        )));
    }

    /**
     * Track a public complaint by tracking code (no auth) - optimized
     */
    @GetMapping("/track/{trackingCode}")
    public ResponseEntity<?> trackComplaint(@PathVariable String trackingCode) {
        try {
            var complaint = complaintService.findByTrackingCode(trackingCode);
            if (complaint == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Code de suivi invalide"));
            }

            Map<String, Object> result = new java.util.HashMap<>(Map.of(
                    "trackingCode", complaint.getTrackingCode(),
                    "subject", complaint.getSubject(),
                    "status", complaint.getStatus().name(),
                    "createdAt", complaint.getCreatedAt().toString(),
                    "category", complaint.getCategory() != null ? complaint.getCategory() : ""
            ));

            // Include decision info if decision has been made
            if (complaint.getDecisionDate() != null) {
                result.put("decisionDate", complaint.getDecisionDate().toString());
            }
            if (complaint.getDecision() != null) {
                result.put("decision", complaint.getDecision());
            }
            if (complaint.getInvestigationDeadline() != null) {
                result.put("investigationDeadline", complaint.getInvestigationDeadline().toString());
            }

            return ResponseEntity.ok(ApiResponse.success("Plainte trouvée", result));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Update complaint status (RECEIVED → UNDER_REVIEW → INVESTIGATION)
     */
    @PostMapping("/{id}/status")
    public ResponseEntity<ApiResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès non autorisé"));
        }

        try {
            String statusStr = (String) data.get("status");
            String notes = (String) data.get("notes");
            ComplaintStatus newStatus = ComplaintStatus.valueOf(statusStr);

            Complaint complaint = complaintService.updateStatus(id, newStatus, notes);
            return ResponseEntity.ok(ApiResponse.success(
                    "Statut mis à jour: " + complaint.getStatus().name(),
                    Map.of(
                            "id", complaint.getId(),
                            "trackingCode", complaint.getTrackingCode(),
                            "status", complaint.getStatus().name()
                    )
            ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error updating status for complaint {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur: " + e.getMessage()));
        }
    }

    /**
     * Assign an investigator to a complaint (PRO_21: person not involved)
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse> assignInvestigator(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Seul le RQ peut assigner une plainte"));
        }

        try {
            Long investigatorId = Long.valueOf(data.get("investigatorId").toString());
            Complaint complaint = complaintService.assignInvestigator(id, investigatorId);
            return ResponseEntity.ok(ApiResponse.success(
                    "Plainte assignée avec succès",
                    Map.of(
                            "id", complaint.getId(),
                            "trackingCode", complaint.getTrackingCode(),
                            "status", complaint.getStatus().name(),
                            "assignedTo", complaint.getAssignedToUser().getFullName(),
                            "deadline", complaint.getInvestigationDeadline().toString()
                    )
            ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error assigning complaint {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur: " + e.getMessage()));
        }
    }

    /**
     * Resolve a founded complaint (corrective actions completed)
     */
    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse> resolveComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès non autorisé"));
        }

        try {
            String notes = (String) data.get("notes");
            Complaint complaint = complaintService.resolveComplaint(id, notes);
            return ResponseEntity.ok(ApiResponse.success(
                    "Plainte marquée comme résolue",
                    Map.of("id", complaint.getId(), "status", complaint.getStatus().name())
            ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error resolving complaint {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur: " + e.getMessage()));
        }
    }

    /**
     * Close a complaint with a final response (PRO_21)
     */
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse> closeComplaint(
            @PathVariable Long id,
            @RequestBody Map<String, Object> data,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès non autorisé"));
        }

        try {
            String finalResponse = (String) data.get("finalResponse");
            Complaint complaint = complaintService.closeComplaint(id, finalResponse);
            return ResponseEntity.ok(ApiResponse.success(
                    "Plainte clôturée avec succès",
                    Map.of("id", complaint.getId(), "status", complaint.getStatus().name())
            ));
        } catch (Exception e) {
            log.error("[COMPLAINT] Error closing complaint {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Erreur: " + e.getMessage()));
        }
    }

    /**
     * Get deadline alerts (overdue and approaching complaints)
     */
    @GetMapping("/deadlines")
    public ResponseEntity<?> getDeadlineAlerts(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès non autorisé"));
        }

        Map<String, List<Complaint>> alerts = complaintService.getDeadlineAlerts();
        return ResponseEntity.ok(ApiResponse.success("Alertes délais", alerts));
    }

    /**
     * Get available staff for investigation assignment (RQ endpoint)
     */
    @GetMapping("/assignable-staff")
    public ResponseEntity<?> getAssignableStaff(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        UserRole role = (UserRole) session.getAttribute("userRole");

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentification requise"));
        }

        if (role != UserRole.RQ && role != UserRole.DG && role != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Accès non autorisé"));
        }

        List<Map<String, Object>> staff = complaintService.getAssignableStaff();
        return ResponseEntity.ok(ApiResponse.success("Personnel disponible", staff));
    }
}
