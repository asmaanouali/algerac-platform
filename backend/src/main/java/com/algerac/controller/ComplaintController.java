package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.Complaint;
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
     * Get complaint statistics (for RQ dashboard)
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
        long received = all.stream().filter(c -> c.getStatus().name().equals("RECEIVED")).count();
        long underReview = all.stream().filter(c -> c.getStatus().name().equals("UNDER_REVIEW")).count();
        long investigation = all.stream().filter(c -> c.getStatus().name().equals("INVESTIGATION")).count();
        long founded = all.stream().filter(c -> c.getStatus().name().equals("FOUNDED")).count();
        long unfounded = all.stream().filter(c -> c.getStatus().name().equals("UNFOUNDED")).count();
        long resolved = all.stream().filter(c -> c.getStatus().name().equals("RESOLVED")).count();
        long closed = all.stream().filter(c -> c.getStatus().name().equals("CLOSED")).count();
        long publicCount = all.stream().filter(c -> Boolean.TRUE.equals(c.getIsPublic())).count();
        long internalCount = all.stream().filter(c -> !Boolean.TRUE.equals(c.getIsPublic())).count();

        return ResponseEntity.ok(ApiResponse.success("Statistiques", Map.of(
                "total", total,
                "received", received,
                "underReview", underReview,
                "investigation", investigation,
                "founded", founded,
                "unfounded", unfounded,
                "resolved", resolved,
                "closed", closed,
                "public", publicCount,
                "internal", internalCount
        )));
    }

    /**
     * Track a public complaint by tracking code (no auth)
     */
    @GetMapping("/track/{trackingCode}")
    public ResponseEntity<?> trackComplaint(@PathVariable String trackingCode) {
        try {
            var complaint = complaintService.getAllComplaints().stream()
                    .filter(c -> c.getTrackingCode().equals(trackingCode))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Code de suivi invalide"));

            return ResponseEntity.ok(ApiResponse.success("Plainte trouvée", Map.of(
                    "trackingCode", complaint.getTrackingCode(),
                    "subject", complaint.getSubject(),
                    "status", complaint.getStatus().name(),
                    "createdAt", complaint.getCreatedAt().toString(),
                    "category", complaint.getCategory() != null ? complaint.getCategory() : ""
            )));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
