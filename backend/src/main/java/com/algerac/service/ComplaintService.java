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
     * Update complaint status (RECEIVED → UNDER_REVIEW → INVESTIGATION)
     */
    @Transactional
    public Complaint updateStatus(Long complaintId, ComplaintStatus newStatus, String notes) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Plainte non trouvée"));

        ComplaintStatus current = complaint.getStatus();

        // Validate allowed transitions
        boolean valid = switch (newStatus) {
            case UNDER_REVIEW -> current == ComplaintStatus.RECEIVED;
            case INVESTIGATION -> current == ComplaintStatus.UNDER_REVIEW || current == ComplaintStatus.ASSIGNED;
            default -> false;
        };
        if (!valid) {
            throw new RuntimeException("Transition de statut invalide: " + current + " → " + newStatus);
        }

        complaint.setStatus(newStatus);
        if (notes != null && !notes.isBlank()) {
            String existing = complaint.getRqNotes() != null ? complaint.getRqNotes() + "\n" : "";
            complaint.setRqNotes(existing + "[" + LocalDateTime.now().toLocalDate() + "] " + notes);
        }
        complaint = complaintRepository.save(complaint);
        log.info("Complaint {} status updated: {} → {}", complaint.getTrackingCode(), current, newStatus);

        // Notify complainant if platform user
        if (complaint.getSubmittedByUser() != null) {
            notificationService.createNotification(
                    complaint.getSubmittedByUser().getId(),
                    "Mise à jour de votre plainte " + complaint.getTrackingCode(),
                    String.format("Votre plainte \"%s\" est passée au statut : %s.", complaint.getSubject(), newStatus.name()),
                    "info"
            );
        }

        return complaint;
    }

    /**
     * Assign an investigator to a complaint (PRO_21: person not involved in the activity at issue)
     */
    @Transactional
    public Complaint assignInvestigator(Long complaintId, Long investigatorId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Plainte non trouvée"));

        User investigator = userRepository.findById(investigatorId)
                .orElseThrow(() -> new RuntimeException("Investigateur non trouvé"));

        complaint.setAssignedToUser(investigator);
        complaint.setStatus(ComplaintStatus.ASSIGNED);
        // PRO_21: deadline is 3 months max
        complaint.setInvestigationDeadline(LocalDateTime.now().plusMonths(3));
        complaint = complaintRepository.save(complaint);
        log.info("Complaint {} assigned to {} (deadline: {})",
                complaint.getTrackingCode(), investigator.getFullName(), complaint.getInvestigationDeadline());

        // Notify the assigned investigator
        notificationService.createNotification(
                investigatorId,
                "Plainte assignée pour investigation",
                String.format("La plainte %s - \"%s\" vous a été assignée. Catégorie: %s. Deadline: %s.",
                        complaint.getTrackingCode(), complaint.getSubject(), complaint.getCategory(),
                        complaint.getInvestigationDeadline().toLocalDate()),
                "warning"
        );

        return complaint;
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

        // For FOUNDED complaints, set investigation deadline to 3 months per PRO_21
        if (newStatus == ComplaintStatus.FOUNDED && complaint.getInvestigationDeadline() == null) {
            complaint.setInvestigationDeadline(LocalDateTime.now().plusMonths(3));
        }

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

        // Send decision email to complainant (PRO_21 requires written response)
        try {
            sendDecisionEmail(complaint, newStatus);
        } catch (Exception e) {
            log.warn("Failed to send decision email for complaint {}: {}", complaint.getTrackingCode(), e.getMessage());
        }

        return complaint;
    }

    /**
     * Resolve a founded complaint (corrective actions completed)
     */
    @Transactional
    public Complaint resolveComplaint(Long complaintId, String resolutionNotes) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Plainte non trouvée"));

        if (complaint.getStatus() != ComplaintStatus.FOUNDED && complaint.getStatus() != ComplaintStatus.CORRECTIVE_ACTIONS) {
            throw new RuntimeException("Seule une plainte fondée ou en actions correctives peut être résolue");
        }

        complaint.setStatus(ComplaintStatus.RESOLVED);
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            String existing = complaint.getRqNotes() != null ? complaint.getRqNotes() + "\n" : "";
            complaint.setRqNotes(existing + "[" + LocalDateTime.now().toLocalDate() + " - Résolution] " + resolutionNotes);
        }
        complaint = complaintRepository.save(complaint);
        log.info("Complaint {} resolved", complaint.getTrackingCode());

        if (complaint.getSubmittedByUser() != null) {
            notificationService.createNotification(
                    complaint.getSubmittedByUser().getId(),
                    "Plainte résolue - " + complaint.getTrackingCode(),
                    String.format("Les actions correctives pour votre plainte \"%s\" ont été mises en œuvre. La plainte est résolue.", complaint.getSubject()),
                    "success"
            );
        }

        return complaint;
    }

    /**
     * Close a complaint with a final response (PRO_21: response at end of treatment)
     */
    @Transactional
    public Complaint closeComplaint(Long complaintId, String finalResponse) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new RuntimeException("Plainte non trouvée"));

        if (complaint.getStatus() != ComplaintStatus.RESOLVED && complaint.getStatus() != ComplaintStatus.UNFOUNDED) {
            throw new RuntimeException("Seule une plainte résolue ou non fondée peut être clôturée");
        }

        complaint.setStatus(ComplaintStatus.CLOSED);
        if (finalResponse != null && !finalResponse.isBlank()) {
            String existing = complaint.getRqNotes() != null ? complaint.getRqNotes() + "\n" : "";
            complaint.setRqNotes(existing + "[" + LocalDateTime.now().toLocalDate() + " - Clôture] " + finalResponse);
        }
        complaint = complaintRepository.save(complaint);
        log.info("Complaint {} closed", complaint.getTrackingCode());

        // Send final response email to complainant (PRO_21 requires final response)
        try {
            sendClosureEmail(complaint, finalResponse);
        } catch (Exception e) {
            log.warn("Failed to send closure email for complaint {}: {}", complaint.getTrackingCode(), e.getMessage());
        }

        return complaint;
    }

    /**
     * Get complaints approaching or past their 3-month deadline
     */
    public Map<String, List<Complaint>> getDeadlineAlerts() {
        List<Complaint> all = complaintRepository.findAllByOrderByCreatedAtDesc();
        LocalDateTime now = LocalDateTime.now();

        List<Complaint> overdue = all.stream()
                .filter(c -> c.getInvestigationDeadline() != null
                        && now.isAfter(c.getInvestigationDeadline())
                        && !List.of(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.UNFOUNDED).contains(c.getStatus()))
                .toList();

        List<Complaint> approaching = all.stream()
                .filter(c -> c.getInvestigationDeadline() != null
                        && now.isBefore(c.getInvestigationDeadline())
                        && now.plusWeeks(2).isAfter(c.getInvestigationDeadline())
                        && !List.of(ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED, ComplaintStatus.UNFOUNDED).contains(c.getStatus()))
                .toList();

        return Map.of("overdue", overdue, "approaching", approaching);
    }

    /**
     * Send decision email to complainant (PRO_21: written notification with reasons)
     */
    private void sendDecisionEmail(Complaint complaint, ComplaintStatus decision) {
        String decisionFr = decision == ComplaintStatus.FOUNDED ? "fondée" : "non fondée";
        String subject = "Décision sur votre plainte " + complaint.getTrackingCode() + " | ALGERAC";
        String body = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #00A63E;">
                        <h1 style="color: #00A63E; margin: 0;">ALGERAC</h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Organisme Algérien d'Accréditation</p>
                    </div>
                    <div style="padding: 30px 0;">
                        <p>Bonjour <strong>%s</strong>,</p>
                        <p>Nous vous informons que votre plainte <strong>%s</strong> (objet : « %s ») a fait l'objet d'une analyse approfondie
                           par le département qualité d'ALGERAC conformément à la procédure PRO 21.</p>
                        <div style="background: %s; border: 2px solid %s; border-radius: 10px; padding: 20px; margin: 25px 0;">
                            <p style="font-size: 18px; font-weight: bold; color: %s; margin: 0;">Décision : Plainte %s</p>
                        </div>
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px;"><strong>Analyse et conclusion :</strong></p>
                            <p style="margin: 8px 0 0 0; font-size: 14px;">%s</p>
                        </div>
                        %s
                        <p>Vous pouvez consulter le détail de votre plainte sur notre portail avec le code de suivi <strong>%s</strong>.</p>
                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            Pour toute question, contactez-nous à <a href="mailto:support@algerac.dz" style="color: #00A63E;">support@algerac.dz</a>
                        </p>
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #999; font-size: 12px;">
                        <p>ALGERAC — Organisme Algérien d'Accréditation</p>
                    </div>
                </div>
                """,
                complaint.getComplainantName(),
                complaint.getTrackingCode(),
                complaint.getSubject(),
                decision == ComplaintStatus.FOUNDED ? "#fef2f2" : "#f9fafb",
                decision == ComplaintStatus.FOUNDED ? "#ef4444" : "#9ca3af",
                decision == ComplaintStatus.FOUNDED ? "#dc2626" : "#6b7280",
                decisionFr,
                complaint.getDecision() != null ? complaint.getDecision() : "",
                decision == ComplaintStatus.FOUNDED && complaint.getCorrectiveActions() != null
                        ? "<div style='background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;'>"
                        + "<p style='margin: 0; font-size: 14px;'><strong>Actions correctives prévues :</strong></p>"
                        + "<p style='margin: 8px 0 0 0;'>" + complaint.getCorrectiveActions() + "</p></div>"
                        : "",
                complaint.getTrackingCode()
        );

        emailService.sendGenericEmail(complaint.getComplainantEmail(), subject, body);
    }

    /**
     * Send closure email (PRO_21: final response at end of treatment)
     */
    private void sendClosureEmail(Complaint complaint, String finalResponse) {
        String subject = "Clôture de votre plainte " + complaint.getTrackingCode() + " | ALGERAC";
        String body = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #00A63E;">
                        <h1 style="color: #00A63E; margin: 0;">ALGERAC</h1>
                    </div>
                    <div style="padding: 30px 0;">
                        <p>Bonjour <strong>%s</strong>,</p>
                        <p>Nous vous informons que le traitement de votre plainte <strong>%s</strong> est désormais terminé.</p>
                        <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 10px; padding: 20px; margin: 25px 0;">
                            <p style="font-size: 18px; font-weight: bold; color: #16a34a; margin: 0;">Dossier clôturé</p>
                        </div>
                        %s
                        <p>L'ensemble du dossier (fiche FOR 50, fiche de non-conformité FOR 02-1, preuves et réponses)
                           est conservé conformément à la procédure PRO 21.</p>
                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            ALGERAC — Organisme Algérien d'Accréditation
                        </p>
                    </div>
                </div>
                """,
                complaint.getComplainantName(),
                complaint.getTrackingCode(),
                finalResponse != null && !finalResponse.isBlank()
                        ? "<div style='background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;'>"
                        + "<p style='margin: 0;'><strong>Réponse finale :</strong></p>"
                        + "<p style='margin: 8px 0 0 0;'>" + finalResponse + "</p></div>"
                        : ""
        );

        emailService.sendGenericEmail(complaint.getComplainantEmail(), subject, body);
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

    /**
     * Find a complaint by tracking code (optimized - single query)
     */
    public Complaint findByTrackingCode(String trackingCode) {
        return complaintRepository.findByTrackingCode(trackingCode).orElse(null);
    }

    /**
     * Get all staff that can be assigned to investigate complaints
     * PRO_21: Person not involved in the complained activity
     */
    public List<Map<String, Object>> getAssignableStaff() {
        // Available roles for complaint investigation: RQ, CD, RA, DT
        List<UserRole> investigatorRoles = List.of(UserRole.RQ, UserRole.CD, UserRole.RA, UserRole.DT);
        return investigatorRoles.stream()
                .flatMap(role -> userRepository.findByRole(role).stream())
                .map(user -> Map.<String, Object>of(
                        "id", user.getId(),
                        "fullName", user.getFullName(),
                        "role", user.getRole().name(),
                        "email", user.getEmail()
                ))
                .toList();
    }
}
