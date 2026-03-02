package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.ComplaintRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    /**
     * Submit a public complaint (no authentication required)
     */
    @Transactional
    public Complaint submitPublicComplaint(Map<String, Object> data) {
        String trackingCode = generateTrackingCode();

        Complaint complaint = Complaint.builder()
                .trackingCode(trackingCode)
                .complainantName((String) data.get("complainantName"))
                .complainantEmail((String) data.get("complainantEmail"))
                .complainantPhone((String) data.get("complainantPhone"))
                .complainantOrganization((String) data.get("complainantOrganization"))
                .targetOrganization((String) data.get("targetOrganization"))
                .category((String) data.get("category"))
                .subject((String) data.get("subject"))
                .description((String) data.get("description"))
                .expectedResolution((String) data.get("expectedResolution"))
                .isPublic(true)
                .status(ComplaintStatus.RECEIVED)
                .build();

        // Store attachments as JSON
        Object attachments = data.get("attachments");
        if (attachments != null) {
            try {
                complaint.setAttachmentsJson(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(attachments));
            } catch (Exception e) {
                log.warn("Could not serialize attachments: {}", e.getMessage());
            }
        }

        complaint = complaintRepository.save(complaint);
        log.info("Public complaint submitted: {} - {}", trackingCode, complaint.getSubject());

        // Send confirmation email with tracking code to the complainant
        try {
            emailService.sendComplaintConfirmationEmail(
                    complaint.getComplainantEmail(),
                    complaint.getComplainantName(),
                    trackingCode,
                    complaint.getSubject()
            );
        } catch (Exception e) {
            log.warn("Failed to send complaint confirmation email: {}", e.getMessage());
        }

        // Notify all RQ users
        notifyRQUsers(complaint);

        return complaint;
    }

    /**
     * Submit an internal complaint (authenticated user)
     */
    @Transactional
    public Complaint submitInternalComplaint(Long userId, Map<String, Object> data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        String trackingCode = generateTrackingCode();

        Complaint complaint = Complaint.builder()
                .trackingCode(trackingCode)
                .complainantName(user.getFullName())
                .complainantEmail(user.getEmail())
                .complainantPhone(user.getPhone())
                .targetOrganization((String) data.get("targetOrganization"))
                .category((String) data.get("category"))
                .subject((String) data.get("subject"))
                .description((String) data.get("description"))
                .expectedResolution((String) data.get("expectedResolution"))
                .isPublic(false)
                .submittedByUser(user)
                .submittedByRole(user.getRole().name())
                .status(ComplaintStatus.RECEIVED)
                .build();

        Object attachments = data.get("attachments");
        if (attachments != null) {
            try {
                complaint.setAttachmentsJson(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(attachments));
            } catch (Exception e) {
                log.warn("Could not serialize attachments: {}", e.getMessage());
            }
        }

        complaint = complaintRepository.save(complaint);
        log.info("Internal complaint submitted by user {}: {} - {}", userId, trackingCode, complaint.getSubject());

        // Send confirmation email with tracking code
        try {
            emailService.sendComplaintConfirmationEmail(
                    complaint.getComplainantEmail(),
                    complaint.getComplainantName(),
                    trackingCode,
                    complaint.getSubject()
            );
        } catch (Exception e) {
            log.warn("Failed to send complaint confirmation email: {}", e.getMessage());
        }

        notifyRQUsers(complaint);

        return complaint;
    }

    /**
     * Get all complaints (for RQ dashboard)
     */
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get complaints submitted by a specific user
     */
    public List<Complaint> getComplaintsByUser(Long userId) {
        return complaintRepository.findBySubmittedByUserId(userId);
    }

    /**
     * Make a decision on a complaint (founded/unfounded)
     */
    @Transactional
    public Complaint makeDecision(Long complaintId, Map<String, Object> data) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Plainte non trouvée"));

        String statusStr = (String) data.get("status");
        ComplaintStatus newStatus = ComplaintStatus.valueOf(statusStr);
        complaint.setStatus(newStatus);
        complaint.setDecision((String) data.get("decision"));
        complaint.setRqNotes((String) data.get("rqNotes"));
        complaint.setCorrectiveActions((String) data.get("correctiveActions"));
        complaint.setDecisionDate(LocalDateTime.now());

        complaint = complaintRepository.save(complaint);
        log.info("Decision made on complaint {}: {}", complaint.getTrackingCode(), newStatus);

        // Notify the complainant if they're a platform user
        if (complaint.getSubmittedByUser() != null) {
            String decisionLabel = newStatus == ComplaintStatus.FOUNDED ? "fondée" : "non fondée";
            notificationService.createNotification(
                    complaint.getSubmittedByUser().getId(),
                    "Décision sur votre plainte " + complaint.getTrackingCode(),
                    String.format("Votre plainte \"%s\" a été jugée %s. %s",
                            complaint.getSubject(), decisionLabel,
                            complaint.getDecision() != null ? complaint.getDecision() : ""),
                    newStatus == ComplaintStatus.FOUNDED ? "warning" : "info"
            );
        }

        return complaint;
    }

    /**
     * Notify all RQ role users about a new complaint
     */
    private void notifyRQUsers(Complaint complaint) {
        List<User> rqUsers = userRepository.findByRole(UserRole.RQ);
        for (User rq : rqUsers) {
            notificationService.createNotification(
                    rq.getId(),
                    "Nouvelle plainte reçue",
                    String.format("Plainte %s - %s de %s (%s). Catégorie: %s.",
                            complaint.getTrackingCode(),
                            complaint.getSubject(),
                            complaint.getComplainantName(),
                            complaint.getIsPublic() ? "formulaire public" : "interne",
                            complaint.getCategory()),
                    "warning"
            );
        }
    }

    private static final String BASE32_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private String generateTrackingCode() {
        int year = LocalDateTime.now().getYear() % 100;
        String code;
        do {
            StringBuilder sb = new StringBuilder(8);
            for (int i = 0; i < 8; i++) {
                sb.append(BASE32_CHARS.charAt(SECURE_RANDOM.nextInt(BASE32_CHARS.length())));
            }
            code = String.format("PLT-%02d-%s", year, sb.toString());
        } while (complaintRepository.findByTrackingCode(code).isPresent());
        return code;
    }
}
