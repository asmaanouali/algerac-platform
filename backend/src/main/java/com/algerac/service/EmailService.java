
package com.algerac.service;

import com.algerac.model.OECApplication;
import com.algerac.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfGenerationService pdfGenerationService;

    @Value("${app.notification.email}")
    private String notificationEmail;

    @Value("${app.dt.email}")
    private String dtEmail;

    @Value("${app.ges.competences.email}")
    private String gesCompetencesEmail;

    @Value("${app.dag.email:asmaanouali256@gmail.com}")
    private String dagEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy 'à' HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ============================================================
    // BRANDED HTML TEMPLATE HELPERS
    // ============================================================

    /** Wraps content HTML in the ALGERAC branded header & footer chrome. */
    public String wrapBrandedHtml(String contentHtml) {
        return ("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #00A63E;">
                        <h1 style="color: #00A63E; margin: 0;">ALGERAC</h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Organisme Algérien d'Accréditation</p>
                    </div>
                    <div style="padding: 30px 0;">
                        %s
                    </div>
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #999; font-size: 12px;">
                        <p>ALGERAC — Organisme Algérien d'Accréditation</p>
                        <p>Site Web : <a href="https://algerac.dz" style="color: #00A63E;">algerac.dz</a></p>
                    </div>
                </div>
                """).formatted(contentHtml);
    }

    private String detailsCard(String title, LinkedHashMap<String, String> rows) {
        StringBuilder rowsHtml = new StringBuilder();
        for (var entry : rows.entrySet()) {
            String value = entry.getValue();
            if (value == null || value.isBlank()) value = "Non renseigné";
            rowsHtml.append("<p style=\"margin: 6px 0; font-size: 14px; color: #333;\"><strong>")
                    .append(entry.getKey()).append(" :</strong> ")
                    .append(value)
                    .append("</p>");
        }
        String header = (title == null || title.isBlank()) ? "" :
                "<p style=\"margin: 0 0 10px 0; font-weight: bold; color: #333; font-size: 14px;\">" + title + "</p>";
        return ("""
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px 20px; margin: 20px 0;">
                    %s
                    %s
                </div>
                """).formatted(header, rowsHtml.toString());
    }

    private String spotlightCard(String label, String value, String hint) {
        String hintHtml = (hint == null || hint.isBlank()) ? "" :
                "<p style=\"color: #888; font-size: 12px; margin: 8px 0 0 0;\">" + hint + "</p>";
        return ("""
                <div style="background: #f0f7ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                    <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">%s</p>
                    <p style="font-size: 28px; font-weight: bold; color: #1e40af; font-family: monospace; margin: 0; letter-spacing: 2px;">%s</p>
                    %s
                </div>
                """).formatted(label, value, hintHtml);
    }

    /** Colored callout: "info", "success", "warning", "danger". */
    private String calloutCard(String title, String bodyHtml, String variant) {
        String bg, border, fg;
        switch (variant == null ? "info" : variant) {
            case "warning" -> { bg = "#fef3c7"; border = "#f59e0b"; fg = "#92400e"; }
            case "success" -> { bg = "#f0fdf4"; border = "#22c55e"; fg = "#16a34a"; }
            case "danger"  -> { bg = "#fef2f2"; border = "#ef4444"; fg = "#dc2626"; }
            default        -> { bg = "#f0f7ff"; border = "#3b82f6"; fg = "#1e40af"; }
        }
        String titleHtml = (title == null || title.isBlank()) ? "" :
                "<p style=\"margin: 0 0 8px 0; font-weight: bold; color: " + fg + "; font-size: 15px;\">" + title + "</p>";
        return ("""
                <div style="background: %s; border: 2px solid %s; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
                    %s
                    <p style="margin: 0; color: %s; font-size: 14px; line-height: 1.5;">%s</p>
                </div>
                """).formatted(bg, border, titleHtml, fg, bodyHtml);
    }

    private String credentialsCard(String email, String password) {
        return ("""
                <div style="background: #f0f7ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; margin: 25px 0;">
                    <p style="margin: 0 0 12px 0; font-weight: bold; color: #1e40af; font-size: 15px;">Vos identifiants de connexion</p>
                    <p style="margin: 6px 0; font-size: 14px; color: #333;"><strong>Email :</strong> <span style="font-family: monospace;">%s</span></p>
                    <p style="margin: 6px 0; font-size: 14px; color: #333;"><strong>Mot de passe :</strong> <span style="font-family: monospace; background: #fff; padding: 2px 8px; border-radius: 4px;">%s</span></p>
                </div>
                """).formatted(email, password);
    }

    private String supportLine() {
        return """
                <p style="color: #666; font-size: 13px; margin-top: 30px;">
                    Pour toute question, n'hésitez pas à nous contacter à
                    <a href="mailto:support@algerac.dz" style="color: #00A63E;">support@algerac.dz</a>.
                </p>
                """;
    }

    /** Public branded HTML email — wraps the given content in the ALGERAC chrome. */
    public void sendBrandedEmail(String to, String subject, String contentHtml) {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException(
                    "SMTP non configuré : définissez les variables d'environnement MAIL_USERNAME et MAIL_PASSWORD");
        }
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrapBrandedHtml(contentHtml), true);
            mailSender.send(mimeMessage);
            log.info("Email envoyé à {} - {}", to, subject);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {} ({})", to, subject, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    /** Branded HTML email with PDF attachment. */
    private void sendBrandedEmailWithAttachment(String to, String subject, String contentHtml,
                                                 String filename, byte[] pdfBytes) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(wrapBrandedHtml(contentHtml), true);
            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));
            mailSender.send(mimeMessage);
            log.info("Email avec pièce jointe envoyé à {} - {}", to, subject);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec PJ à {} ({})", to, subject, e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    private static String safe(String value) {
        return (value == null || value.isBlank()) ? "Non renseigné" : value;
    }

    // ============================================================
    // PASSWORD RESET
    // ============================================================

    public void sendOtpResetPassword(User user, String otp) {
        log.info("[EMAIL SERVICE] Début sendOtpResetPassword pour {}", user.getEmail());
        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme ALGERAC.</p>
                %s
                <p style="text-align: center; color: #666; font-size: 13px; margin-top: -10px;">
                    Ce code est valable <strong>15 minutes</strong>.
                </p>
                <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
                %s
                """.formatted(
                        user.getFullName(),
                        spotlightCard("Votre code de vérification", otp, null),
                        supportLine());
        sendBrandedEmail(user.getEmail(), "Réinitialisation du mot de passe - ALGERAC", content);
    }

    public void sendLoginOtp(User user, String otp) {
        log.info("[EMAIL SERVICE] Début sendLoginOtp pour {}", user.getEmail());
        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Une tentative de connexion à votre compte ALGERAC nécessite une vérification supplémentaire.</p>
                %s
                <p style="text-align: center; color: #666; font-size: 13px; margin-top: -10px;">
                    Ce code est valable <strong>5 minutes</strong>.
                </p>
                <p>Si vous n'êtes pas à l'origine de cette tentative de connexion, changez votre mot de passe immédiatement.</p>
                %s
                """.formatted(
                        user.getFullName(),
                        spotlightCard("Votre code de connexion", otp, null),
                        supportLine());
        sendBrandedEmail(user.getEmail(), "Code de vérification de connexion - ALGERAC", content);
    }

    // ============================================================
    // OEC REGISTRATION (legacy User-based)
    // ============================================================

    public void sendOECRegistrationNotification(User user) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Organisme", user.getOrganizationName());
        rows.put("Email", user.getEmail());
        String content = """
                <p>Bonjour,</p>
                <p>Une nouvelle demande d'inscription <strong>OEC</strong> a été reçue et nécessite votre approbation.</p>
                %s
                <p>Le formulaire <strong>DOC 1</strong> complet est joint à cet email.</p>
                """.formatted(detailsCard("Informations de la demande", rows));

        byte[] pdfBytes = pdfGenerationService.generateDoc1Pdf(user);
        String filename = String.format("DOC1_%s_%s.pdf",
                user.getOrganizationName().replaceAll("[^a-zA-Z0-9]", "_"),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()));
        sendBrandedEmailWithAttachment(dtEmail,
                String.format("[OEC] Nouvelle inscription - %s", user.getOrganizationName()),
                content, filename, pdfBytes);
    }

    public void sendRejectionEmail(com.algerac.model.AccreditationRequest request, String reason) {
        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Nous vous informons que votre demande d'accréditation <strong>%s</strong> a été déclarée non recevable.</p>
                %s
                <p>Veuillez vous connecter à votre compte sur la plateforme ALGERAC pour consulter les détails
                   et prendre les mesures nécessaires pour régulariser votre dossier.</p>
                %s
                """.formatted(
                        request.getOec().getOrganizationName(),
                        request.getReferenceNumber(),
                        calloutCard("Motif du rejet", reason, "danger"),
                        supportLine());
        sendBrandedEmail(request.getOec().getEmail(),
                "Demande non recevable - " + request.getReferenceNumber(),
                content);
    }

    // ============================================================
    // EXPERT / EVALUATEUR / FORMATEUR REGISTRATION
    // ============================================================

    public void sendExpertRegistrationNotification(User user) {
        String typeLabel = getExpertTypeLabel(user);

        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID", user.getRegistrationId());
        rows.put("Nom complet", user.getPrenom() + " " + user.getNom());
        rows.put("Email", user.getEmail());
        rows.put("Téléphone", safe(user.getPhone()));
        rows.put("Domaine d'expertise", safe(user.getDomaineExpertise()));
        rows.put("Date de candidature", user.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Une nouvelle candidature <strong>%s</strong> a été reçue.</p>
                %s
                <p>Le formulaire <strong>FOR 20</strong> complet est disponible en pièce jointe.</p>
                """.formatted(typeLabel, detailsCard("Informations du candidat", rows));

        byte[] pdfBytes = pdfGenerationService.generateFor20Pdf(user);
        String filename = String.format("FOR_20_%s_%s_%s_%s.pdf",
                user.getRegistrationId(),
                user.getNom(),
                user.getPrenom(),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()));
        sendBrandedEmailWithAttachment(gesCompetencesEmail,
                String.format("[%s] Nouvelle inscription %s - %s %s",
                        user.getRegistrationId(), typeLabel, user.getNom(), user.getPrenom()),
                content, filename, pdfBytes);
    }

    public void sendConfirmationToUser(User user) {
        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Votre demande d'inscription sur la plateforme ALGERAC a bien été reçue.</p>
                <p>Votre dossier est actuellement en cours d'examen. Vous recevrez un email de confirmation
                   dès que votre compte sera approuvé par notre équipe.</p>
                %s
                """.formatted(user.getFullName(), supportLine());
        sendBrandedEmail(user.getEmail(), "Confirmation d'inscription - ALGERAC", content);
    }

    // ============================================================
    // OEC APPLICATION WORKFLOW
    // ============================================================

    public void sendOECApplicationNotificationToDT(OECApplication application) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID de la demande", "#" + application.getId());
        rows.put("Organisme", application.getNomOrganisme());
        rows.put("Email", application.getEmail());
        rows.put("Téléphone", safe(application.getTelephone()));
        rows.put("Représentant", safe(application.getNomRepresentant()));
        rows.put("Date de candidature", application.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Une nouvelle demande d'inscription <strong>OEC</strong> a été reçue et nécessite votre approbation.</p>
                %s
                <p>Le formulaire <strong>DOC 1</strong> complet est joint à cet email.</p>
                <p>Veuillez consulter cette demande sur la plateforme pour l'approuver ou la refuser.</p>
                """.formatted(detailsCard("Informations de la demande", rows));

        byte[] pdfBytes = pdfGenerationService.generateOECApplicationPdf(application);
        String filename = String.format("DOC1_%s_%s.pdf",
                application.getNomOrganisme().replaceAll("[^a-zA-Z0-9]", "_"),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()));
        sendBrandedEmailWithAttachment(dtEmail,
                String.format("[OEC] Nouvelle demande d'inscription - %s", application.getNomOrganisme()),
                content, filename, pdfBytes);
    }

    public void sendOECApplicationConfirmationToCandidate(OECApplication application) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Numéro de demande", "#" + application.getId());
        rows.put("Date de dépôt", application.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Votre demande d'accréditation OEC pour l'organisme <strong>« %s »</strong> a bien été reçue.</p>
                %s
                <p>Votre dossier est actuellement en cours d'examen par notre équipe technique.
                   Vous recevrez une notification par email dès qu'une décision sera prise concernant votre candidature.</p>
                %s
                """.formatted(application.getNomOrganisme(),
                        detailsCard("Récapitulatif", rows),
                        supportLine());
        sendBrandedEmail(application.getEmail(),
                "Confirmation de votre demande d'accréditation - ALGERAC", content);
    }

    public void sendOECApplicationRejectionToCandidate(OECApplication application, String rejectionReason) {
        String content = """
                <p>Bonjour,</p>
                <p>Nous avons examiné votre demande d'accréditation pour l'organisme <strong>« %s »</strong>.</p>
                <p>Après étude de votre dossier, nous sommes au regret de vous informer que votre demande
                   n'a pas pu être acceptée pour le(s) motif(s) suivant(s) :</p>
                %s
                <p>Si vous souhaitez obtenir des informations complémentaires ou déposer une nouvelle demande
                   après avoir pris en compte les observations, n'hésitez pas à nous contacter.</p>
                %s
                """.formatted(application.getNomOrganisme(),
                        calloutCard("Motif de refus", rejectionReason, "danger"),
                        supportLine());
        sendBrandedEmail(application.getEmail(),
                "Décision concernant votre demande d'accréditation - ALGERAC", content);
    }

    public void sendOECApplicationApprovedNotificationToAdmin(OECApplication application) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID de la demande", "#" + application.getId());
        rows.put("Organisme", application.getNomOrganisme());
        rows.put("Email", application.getEmail());
        rows.put("Téléphone", safe(application.getTelephone()));
        rows.put("Représentant", safe(application.getNomRepresentant()));
        rows.put("Approuvé le", application.getReviewedByDtAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour Administrateur,</p>
                <p>Une candidature <strong>OEC</strong> a été approuvée par le DT et nécessite la création d'un compte utilisateur :</p>
                %s
                <p>Veuillez créer le compte utilisateur pour cet organisme sur la plateforme.</p>
                """.formatted(detailsCard(null, rows));
        sendBrandedEmail(notificationEmail,
                String.format("[OEC] Candidature approuvée - Action requise pour %s", application.getNomOrganisme()),
                content);
    }

    public void sendCandidatureApprovedEmail(User user) {
        String userTypeLabel = getUserTypeLabel(user);
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Type", userTypeLabel);
        rows.put("Email", user.getEmail());
        rows.put("Date de soumission", user.getCreatedAt().format(DATE_TIME_FMT));
        rows.put("Date d'approbation", user.getDateApprobation().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Nous avons le plaisir de vous informer que votre candidature en tant que <strong>%s</strong>
                   a été approuvée par notre Direction Technique.</p>
                %s
                %s
                <p>Votre compte est maintenant actif. Vous pouvez vous connecter à la plateforme ALGERAC avec vos identifiants.</p>
                <p>Bienvenue dans l'équipe ALGERAC !</p>
                """.formatted(user.getFullName(), userTypeLabel,
                        detailsCard("Détails de votre candidature", rows),
                        calloutCard(null, "Votre candidature a été approuvée.", "success"));
        sendBrandedEmail(user.getEmail(), "Candidature approuvée - ALGERAC", content);
    }

    public void sendCandidatureRejectedEmail(User user, String rejectionReason) {
        String userTypeLabel = getUserTypeLabel(user);
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Type", userTypeLabel);
        rows.put("Email", user.getEmail());
        rows.put("Date de soumission", user.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Nous vous remercions pour votre intérêt à rejoindre ALGERAC en tant que <strong>%s</strong>.</p>
                <p>Après examen attentif de votre candidature par notre Direction Technique, nous sommes au regret
                   de vous informer que celle-ci n'a pas été retenue.</p>
                %s
                %s
                <p>Nous vous encourageons à réexaminer les critères requis et à soumettre une nouvelle candidature
                   ultérieurement si vous le souhaitez.</p>
                %s
                """.formatted(user.getFullName(), userTypeLabel,
                        detailsCard("Détails de votre candidature", rows),
                        calloutCard("Motif du refus", rejectionReason, "danger"),
                        supportLine());
        sendBrandedEmail(user.getEmail(), "Candidature non retenue - ALGERAC", content);
    }

    private String getUserTypeLabel(User user) {
        if (user.getRole() != null) {
            return switch (user.getRole().name()) {
                case "OEC" -> "Organisme d'Évaluation de la Conformité (OEC)";
                case "EXPERT" -> "Expert";
                case "FORMATEUR" -> "Formateur";
                default -> user.getRole().name();
            };
        }
        if (user.getUserType() != null) return user.getUserType();
        return "Candidat";
    }

    public void sendOECApprovedNotificationToAdmin(User user) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID de l'utilisateur", "#" + user.getId());
        rows.put("Organisme", user.getOrganizationName());
        rows.put("Email", user.getEmail());
        rows.put("Téléphone", safe(user.getPhone()));
        rows.put("Représentant", safe(user.getNomRepresentant()));
        rows.put("Approuvé le", user.getDateApprobation() != null
                ? user.getDateApprobation().format(DATE_TIME_FMT) : "Maintenant");

        String content = """
                <p>Bonjour Administrateur,</p>
                <p>Une candidature OEC a été approuvée par la Direction Technique et nécessite maintenant la création
                   d'un compte utilisateur :</p>
                %s
                <p>Veuillez vous connecter à la plateforme pour créer le compte utilisateur pour cet organisme.
                   Les identifiants seront générés automatiquement et envoyés à l'OEC par email.</p>
                """.formatted(detailsCard(null, rows));
        sendBrandedEmail(notificationEmail,
                String.format("[OEC] Candidature approuvée - Création de compte requise pour %s",
                        user.getOrganizationName()),
                content);
    }

    public void sendOECAccountCredentials(User user, String generatedPassword) {
        String content = """
                <p>Bonjour,</p>
                <p>Nous avons le plaisir de vous informer que votre demande d'accréditation pour l'organisme
                   <strong>« %s »</strong> a été approuvée.</p>
                %s
                %s
                %s
                <p>Bienvenue sur ALGERAC !</p>
                """.formatted(user.getOrganizationName(),
                        calloutCard(null, "Votre compte sur la plateforme ALGERAC est maintenant actif.", "success"),
                        credentialsCard(user.getEmail(), generatedPassword),
                        calloutCard("Sécurité", "Pour des raisons de sécurité, nous vous recommandons fortement de vous connecter dès que possible et de changer votre mot de passe après la première connexion.", "warning"));
        sendBrandedEmail(user.getEmail(),
                "Votre compte ALGERAC a été créé - Identifiants de connexion", content);
    }

    public void sendOECRegistrationConfirmation(User user) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Organisme", user.getOrganizationName());
        rows.put("Email", user.getEmail());
        rows.put("Date de soumission", user.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Nous avons bien reçu votre demande d'accréditation pour l'organisme <strong>« %s »</strong>.</p>
                <p>Votre demande est actuellement en cours d'examen par notre Direction Technique.
                   Vous serez informé(e) par email de l'évolution de votre dossier.</p>
                %s
                %s
                """.formatted(user.getOrganizationName(),
                        detailsCard("Informations de votre demande", rows),
                        supportLine());
        sendBrandedEmail(user.getEmail(),
                "Confirmation de réception - Demande d'accréditation OEC", content);
    }

    public void sendDTNewOECNotification(User user) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID", "#" + user.getId());
        rows.put("Organisme", user.getOrganizationName());
        rows.put("Représentant", safe(user.getNomRepresentant()));
        rows.put("Email", user.getEmail());
        rows.put("Téléphone", safe(user.getPhone()));
        rows.put("Date de soumission", user.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Une nouvelle demande d'accréditation <strong>OEC</strong> a été soumise et nécessite votre examen.</p>
                %s
                <p>Veuillez vous connecter à la plateforme pour examiner la demande et le document <strong>DOC 1</strong>.</p>
                """.formatted(detailsCard("Informations de la demande", rows));
        sendBrandedEmail("orginag65msf@gmail.com",
                "Nouvelle demande d'accréditation OEC - " + user.getOrganizationName(),
                content);
    }

    public void sendOECRejectionByDT(User user, String rejectionReason) {
        String content = """
                <p>Bonjour,</p>
                <p>Nous vous informons que votre demande d'accréditation pour l'organisme <strong>« %s »</strong>
                   n'a pas été retenue par notre Direction Technique.</p>
                %s
                <p>Si vous souhaitez obtenir plus d'informations ou soumettre une nouvelle demande après avoir pris en
                   compte ces observations, n'hésitez pas à nous contacter.</p>
                %s
                """.formatted(user.getOrganizationName(),
                        calloutCard("Motif du rejet", rejectionReason, "danger"),
                        supportLine());
        sendBrandedEmail(user.getEmail(),
                "Demande d'accréditation non retenue - " + user.getOrganizationName(),
                content);
    }

    // ============================================================
    // EXPERT WORKFLOW (post-FOR20 lifecycle)
    // ============================================================

    public void sendExpertRegistrationConfirmation(User user) {
        String typeLabel = getExpertTypeLabel(user);
        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous accusons réception de votre candidature en tant que <strong>%s</strong> au sein de l'organisme ALGERAC.</p>
                <p>Nous vous remercions pour l'intérêt que vous portez à notre organisation et pour le temps consacré
                   à la constitution de votre dossier.</p>
                <p>Votre profil sera examiné avec attention par notre équipe de Gestion des Compétences afin d'évaluer
                   son adéquation avec nos besoins actuels en matière d'accréditation et d'évaluation de la conformité.</p>
                %s
                <p>Si votre profil correspond à nos critères de sélection, vous serez contacté(e) pour la suite du
                   processus de recrutement. Dans tous les cas, nous vous tiendrons informé(e) de l'évolution de votre candidature.</p>
                <p>Nous vous prions de bien vouloir noter que le traitement de votre dossier peut prendre quelques jours ouvrables.</p>
                %s
                """.formatted(user.getPrenom(), user.getNom(), typeLabel,
                        spotlightCard("Référence de votre candidature", user.getRegistrationId(), null),
                        supportLine());
        sendBrandedEmail(user.getEmail(),
                "Accusé de réception de votre candidature - ALGERAC", content);
    }

    public void sendGesCompetencesNotification(User user) {
        String typeLabel = getExpertTypeLabel(user);
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("ID", user.getRegistrationId());
        rows.put("Nom complet", user.getPrenom() + " " + user.getNom());
        rows.put("Email", user.getEmail());
        rows.put("Téléphone", safe(user.getPhone()));
        rows.put("Domaine d'expertise", safe(user.getDomaineExpertise()));
        rows.put("Date de soumission", user.getCreatedAt().format(DATE_TIME_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Une nouvelle candidature <strong>%s</strong> a été soumise et nécessite votre examen.</p>
                %s
                <p>Veuillez vous connecter à la plateforme pour examiner la candidature et le formulaire <strong>FOR 20</strong>.</p>
                """.formatted(typeLabel, detailsCard("Informations du candidat", rows));
        sendBrandedEmail("caroziiinya@gmail.com",
                "Nouvelle candidature " + typeLabel + " - " + user.getNom() + " " + user.getPrenom(),
                content);
    }

    public void sendExpertRejectionByGesCompetences(User user, String rejectionReason) {
        sendExpertDossierNotRetained(user);
    }

    public void sendExpertDossierNotRetained(User user) {
        String typeLabel = getExpertTypeLabel(user);
        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous tenons à vous remercier sincèrement pour l'intérêt que vous portez à ALGERAC et pour le temps
                   que vous avez consacré à la constitution de votre dossier de candidature en tant que <strong>%s</strong>.</p>
                <p>Après un examen attentif de votre profil, nous avons le regret de vous informer que votre candidature
                   n'a pas pu être retenue dans le cadre de nos besoins actuels.</p>
                <p>Cette décision ne remet en aucun cas en question la qualité de votre parcours professionnel ni vos
                   compétences. Nos critères de sélection sont étroitement liés aux spécificités de nos programmes
                   d'accréditation en cours et à la configuration de nos équipes d'évaluation.</p>
                <p>Votre dossier sera conservé dans notre vivier de compétences et pourra être reconsidéré lors de
                   futures opportunités correspondant davantage à votre profil.</p>
                <p>Nous vous souhaitons plein succès dans la poursuite de votre parcours professionnel.</p>
                %s
                """.formatted(user.getPrenom(), user.getNom(), typeLabel, supportLine());
        sendBrandedEmail(user.getEmail(),
                "Suite donnée à votre candidature - ALGERAC", content);
    }

    public void sendFor28AccessEmail(User user, String token, String secretCode) {
        String typeLabel = getExpertTypeLabel(user);
        String for28Url = frontendUrl + "/for28/" + token;

        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous avons le plaisir de vous informer que votre profil a retenu toute notre attention dans le cadre
                   de votre candidature en tant que <strong>%s</strong> au sein d'ALGERAC.</p>
                <p>Après un examen approfondi de votre curriculum vitae (FOR 20), nous souhaitons poursuivre l'étude de
                   votre candidature. À cet effet, nous vous invitons à compléter votre dossier en nous transmettant les
                   documents justificatifs requis via le formulaire confidentiel <strong>FOR 28</strong>.</p>
                %s
                %s
                %s
                <p style="margin: 20px 0 8px 0; font-weight: bold; color: #333;">Documents à joindre :</p>
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.6;">
                    <li>Copie des diplômes et certificats mentionnés dans votre CV</li>
                    <li>Attestations de travail et d'expérience professionnelle</li>
                    <li>Certificats de formation pertinents</li>
                    <li>Tout autre document justificatif de vos qualifications</li>
                </ul>
                <p style="color: #666; font-size: 13px; margin-top: 30px;">
                    Pour toute question ou difficulté technique, n'hésitez pas à nous contacter à
                    <a href="mailto:%s" style="color: #00A63E;">%s</a>.
                </p>
                """.formatted(user.getPrenom(), user.getNom(), typeLabel,
                        spotlightCard("Code secret d'accès", secretCode,
                                "Référence dossier : " + user.getRegistrationId()),
                        calloutCard("Accès au formulaire FOR 28",
                                "<a href=\"" + for28Url + "\" style=\"color: #1e40af; word-break: break-all;\">" + for28Url + "</a>",
                                "info"),
                        calloutCard("Confidentialité",
                                "Ce lien et ce code sont strictement personnels et confidentiels. Vous devrez saisir le code secret ci-dessus pour accéder au formulaire. Ne partagez ce code avec personne. Ce lien est valable pendant <strong>30 jours</strong> à compter de la réception de cet email.",
                                "warning"),
                        gesCompetencesEmail, gesCompetencesEmail);
        sendBrandedEmail(user.getEmail(),
                "Compléter votre dossier - Documents confidentiels - ALGERAC", content);
    }

    public void sendInterviewConvocationEmail(User user, java.time.LocalDateTime interviewDate) {
        String typeLabel = getExpertTypeLabel(user);
        String formattedDate = interviewDate.format(
                DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH'h'mm", Locale.FRENCH));

        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Date et heure", formattedDate);
        rows.put("Lieu", "Siège ALGERAC");
        rows.put("Référence", user.getRegistrationId());

        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous avons le plaisir de vous informer que votre profil a retenu toute notre attention dans le cadre
                   de votre candidature en tant que <strong>%s</strong> au sein d'ALGERAC.</p>
                <p>À la suite de l'examen de votre dossier, nous souhaitons vous convier à un entretien de sélection
                   afin d'approfondir notre connaissance de votre parcours, de vos compétences techniques et de votre
                   adéquation avec les missions que nous proposons.</p>
                %s
                <p>Nous vous prions de bien vouloir confirmer votre présence à cet entretien en répondant à ce mail dans
                   les meilleurs délais. Si la date proposée ne vous convient pas, merci de nous proposer une alternative
                   et nous ferons notre possible pour nous adapter.</p>
                <p style="margin: 20px 0 8px 0; font-weight: bold; color: #333;">Documents à apporter le jour de l'entretien :</p>
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.6;">
                    <li>Une pièce d'identité en cours de validité</li>
                    <li>Les originaux de vos diplômes et certifications</li>
                    <li>Tout document complémentaire attestant de votre expérience professionnelle</li>
                </ul>
                <p>Nous nous réjouissons de vous rencontrer et restons à votre disposition pour toute information complémentaire.</p>
                %s
                """.formatted(user.getPrenom(), user.getNom(), typeLabel,
                        detailsCard("Détails de l'entretien", rows),
                        supportLine());
        sendBrandedEmail(user.getEmail(),
                "Convocation à un entretien - Candidature " + typeLabel + " ALGERAC", content);
    }

    public void sendExpertInterviewNotRetained(User user) {
        String typeLabel = getExpertTypeLabel(user);
        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous tenons à vous remercier chaleureusement pour le temps que vous nous avez accordé lors de notre
                   entretien dans le cadre de votre candidature en tant que <strong>%s</strong>.</p>
                <p>Cet échange nous a permis de mieux apprécier la richesse de votre parcours professionnel et vos
                   compétences techniques. Nous avons été sensibles à la qualité de votre profil et à votre motivation.</p>
                <p>Cependant, après une analyse approfondie de l'ensemble des candidatures reçues et au regard de la
                   configuration actuelle de nos équipes d'évaluation, nous ne sommes pas en mesure de donner une suite
                   favorable à votre candidature pour le moment.</p>
                <p>Nous tenons à souligner que cette décision est exclusivement liée à nos contraintes opérationnelles
                   actuelles et ne reflète en rien un jugement sur vos qualifications professionnelles.</p>
                <p>Votre dossier sera conservé dans notre base de données de compétences qualifiées. Nous ne manquerons
                   pas de vous recontacter si une opportunité correspondant à votre profil se présente à l'avenir.</p>
                <p>Nous vous souhaitons beaucoup de succès dans la suite de votre parcours.</p>
                %s
                """.formatted(user.getPrenom(), user.getNom(), typeLabel, supportLine());
        sendBrandedEmail(user.getEmail(),
                "Suite de votre processus de candidature - ALGERAC", content);
    }

    public void sendExpertAccountAccepted(User user, String generatedPassword) {
        String typeLabel = getExpertTypeLabel(user);
        String content = """
                <p>Bonjour <strong>%s %s</strong>,</p>
                <p>Nous avons le grand plaisir de vous informer que votre candidature en tant que <strong>%s</strong>
                   au sein d'ALGERAC a été retenue.</p>
                <p>Au terme de notre processus de sélection, votre profil a été jugé en parfaite adéquation avec nos
                   exigences en matière de compétences techniques et d'expertise dans le domaine de l'accréditation et
                   de l'évaluation de la conformité.</p>
                %s
                %s
                %s
                <p>Notre équipe se tient à votre disposition pour vous accompagner dans vos premières étapes sur la plateforme.</p>
                <p>Bienvenue dans l'équipe ALGERAC !</p>
                """.formatted(user.getPrenom(), user.getNom(), typeLabel,
                        calloutCard(null, "Votre compte sur la plateforme ALGERAC est désormais actif.", "success"),
                        credentialsCard(user.getEmail(), generatedPassword),
                        calloutCard("Actions recommandées",
                                "1. Connectez-vous à la plateforme<br>2. Modifiez votre mot de passe dès votre première connexion<br>3. Complétez votre profil professionnel",
                                "warning"));
        sendBrandedEmail(user.getEmail(),
                "Félicitations ! Votre candidature a été retenue - ALGERAC", content);
    }

    public void sendBlacklistAppealNotification(User gesUser, User blacklistedUser, String appealMessage) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Nom", blacklistedUser.getFullName());
        rows.put("Email", blacklistedUser.getEmail());
        rows.put("Type", getExpertTypeLabel(blacklistedUser));
        rows.put("Motif de blacklist", safe(blacklistedUser.getBlacklistReason()));
        rows.put("Date de blacklist", blacklistedUser.getBlacklistedAt() != null
                ? blacklistedUser.getBlacklistedAt().format(DATE_TIME_FMT) : "Non spécifié");

        String content = """
                <p>Bonjour,</p>
                <p>Un candidat blacklisté a introduit un recours :</p>
                %s
                %s
                <p>Veuillez examiner ce recours et prendre les mesures appropriées.</p>
                """.formatted(detailsCard("Informations du candidat", rows),
                        calloutCard("Message du candidat", appealMessage, "info"));
        sendBrandedEmail(gesUser.getEmail(),
                "Recours d'un candidat blacklisté - " + blacklistedUser.getFullName(),
                content);
    }

    public void sendInterviewPanelNotification(User candidate, java.time.LocalDateTime interviewDate,
            java.util.List<User> dtUsers, java.util.List<User> rqUsers, User selectedCd, User selectedRa) {

        String typeLabel = getExpertTypeLabel(candidate);
        String formattedDate = interviewDate.format(
                DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH'h'mm", Locale.FRENCH));
        String candidateName = ((candidate.getPrenom() != null ? candidate.getPrenom() : "") + " "
                + (candidate.getNom() != null ? candidate.getNom() : "")).trim();

        LinkedHashMap<String, String> interviewRows = new LinkedHashMap<>();
        interviewRows.put("Date et heure", formattedDate);
        interviewRows.put("Lieu", "Siège ALGERAC");

        LinkedHashMap<String, String> candidateRows = new LinkedHashMap<>();
        candidateRows.put("Nom complet", candidateName);
        candidateRows.put("Type de candidature", typeLabel);
        candidateRows.put("Référence", candidate.getRegistrationId() != null ? candidate.getRegistrationId() : "N/A");
        candidateRows.put("Domaine d'expertise", safe(candidate.getDomaineExpertise()));
        candidateRows.put("Email", candidate.getEmail());
        candidateRows.put("Téléphone", safe(candidate.getPhone()));

        String panelHtml = """
                <ul style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.7;">
                    <li>Directeur Technique (DT)</li>
                    <li>Responsable Qualité (RQ)</li>
                    <li>Chef de Département (CD)%s</li>
                    <li>Responsable d'Accréditation (RA)%s</li>
                    <li>Gestionnaire de Compétences</li>
                </ul>
                """.formatted(
                        selectedCd != null ? " : <strong>" + selectedCd.getFullName() + "</strong>" : "",
                        selectedRa != null ? " : <strong>" + selectedRa.getFullName() + "</strong>" : "");

        String content = """
                <p>Bonjour,</p>
                <p>Vous êtes convié(e) à participer au panel d'entretien pour l'évaluation d'un candidat.</p>
                %s
                %s
                <p style="margin: 20px 0 8px 0; font-weight: bold; color: #333;">Composition du panel :</p>
                %s
                <p>Votre présence est requise pour cet entretien. Vous pouvez consulter le dossier complet du candidat
                   sur la plateforme ALGERAC.</p>
                """.formatted(detailsCard("Détails de l'entretien", interviewRows),
                        detailsCard("Informations sur le candidat", candidateRows),
                        panelHtml);

        String subject = String.format("[PANEL] Entretien %s - %s le %s",
                typeLabel, candidateName,
                interviewDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

        for (User dt : dtUsers) trySendBranded(dt.getEmail(), subject, content);
        for (User rq : rqUsers) trySendBranded(rq.getEmail(), subject, content);
        if (selectedCd != null) trySendBranded(selectedCd.getEmail(), subject, content);
        if (selectedRa != null) trySendBranded(selectedRa.getEmail(), subject, content);

        log.info("Emails de notification panel envoyés pour l'entretien de {} {}",
                candidate.getPrenom(), candidate.getNom());
    }

    private void trySendBranded(String to, String subject, String contentHtml) {
        try {
            sendBrandedEmail(to, subject, contentHtml);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à {}", to, e);
        }
    }

    private String getExpertTypeLabel(User user) {
        if (user.getUserType() == null) return "Expert";
        return switch (user.getUserType().toUpperCase()) {
            case "FORMATEUR" -> "Formateur";
            default -> "Expert";
        };
    }

    // ============================================================
    // COMPLAINT WORKFLOW
    // ============================================================

    public void sendComplaintConfirmationEmail(String recipientEmail, String complainantName,
                                               String trackingCode, String subject) {
        String content = """
                <p>Bonjour <strong>%s</strong>,</p>
                <p>Nous accusons réception de votre plainte et vous confirmons qu'elle a été enregistrée dans notre système.</p>
                %s
                <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;"><strong>Objet :</strong> %s</p>
                </div>
                <p>Votre plainte sera examinée par le Responsable Qualité d'ALGERAC conformément à la norme ISO 17011.
                   Vous serez informé(e) de l'avancement du traitement.</p>
                <p>Vous pouvez à tout moment consulter l'état de votre plainte en vous rendant sur notre portail
                   et en utilisant la fonction <strong>« Suivre ma plainte »</strong> avec votre code de suivi.</p>
                %s
                """.formatted(complainantName,
                        spotlightCard("Votre code de suivi", trackingCode,
                                "Conservez ce code précieusement pour suivre l'état de votre plainte"),
                        subject,
                        supportLine());
        try {
            sendBrandedEmail(recipientEmail,
                    "Confirmation de plainte - " + trackingCode + " | ALGERAC",
                    content);
            log.info("Email de confirmation de plainte envoyé à {} (code: {})", recipientEmail, trackingCode);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation de plainte à {}: {}",
                    recipientEmail, e.getMessage());
            // Don't throw - complaint should still be registered even if email fails
        }
    }

    // ============================================================
    // OEC APPLICATION (additional flows)
    // ============================================================

    public void sendOECApplicationRejectionWithDeficiencies(OECApplication application, String rejectionReason,
                                                             String manquements) {
        StringBuilder body = new StringBuilder();
        body.append(("""
                <p>Bonjour,</p>
                <p>Nous avons examiné votre demande d'accréditation pour l'organisme <strong>« %s »</strong>.</p>
                <p>Après étude de votre dossier, nous sommes au regret de vous informer que votre demande
                   n'a pas pu être acceptée pour le(s) motif(s) suivant(s) :</p>
                %s
                """).formatted(application.getNomOrganisme(),
                        calloutCard("Motif de refus", rejectionReason, "danger")));

        if (manquements != null && !manquements.isBlank()) {
            body.append(calloutCard("Manquements identifiés", manquements, "warning"));
        }

        body.append("""
                <p>Nous vous invitons à prendre en compte ces observations et à déposer une nouvelle demande
                   une fois les corrections effectuées.</p>
                <p>Pour déposer une nouvelle demande, rendez-vous sur la plateforme ALGERAC :
                   <a href="https://algerac.dz/auth/register/oec" style="color: #00A63E;">https://algerac.dz/auth/register/oec</a></p>
                """);
        body.append(supportLine());

        sendBrandedEmail(application.getEmail(),
                "Demande d'accréditation non retenue - ALGERAC", body.toString());
    }

    public void sendOECDepositFeeNotification(OECApplication application) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Montant", application.getDepositFeeAmount().toPlainString() + " DA");
        rows.put("Date limite de paiement", application.getPaymentDeadline().format(DATE_FMT));

        String content = """
                <p>Bonjour,</p>
                <p>Votre demande d'accréditation pour l'organisme <strong>« %s »</strong> a été approuvée par la
                   Direction Technique d'ALGERAC.</p>
                <p>Pour poursuivre le traitement de votre dossier, vous êtes invité(e) à régler les frais de dépôt suivants :</p>
                %s
                <p style="margin: 20px 0 8px 0; font-weight: bold; color: #333;">Modalités de paiement :</p>
                <p>Après avoir effectué le paiement, veuillez envoyer la preuve de paiement (bordereau de virement,
                   reçu de paiement, etc.) par email à l'adresse suivante :
                   <a href="mailto:%s" style="color: #00A63E;">%s</a></p>
                <p>Veuillez mentionner le nom de votre organisme et votre numéro de candidature
                   <strong>(#%d)</strong> dans l'objet du mail.</p>
                %s
                %s
                """.formatted(application.getNomOrganisme(),
                        detailsCard("Frais de dépôt", rows),
                        dagEmail, dagEmail,
                        application.getId(),
                        calloutCard("Important",
                                "Vous disposez d'un délai d'<strong>un mois</strong> à compter de la réception de ce mail pour effectuer le paiement. Passé ce délai, votre demande sera automatiquement rejetée.",
                                "warning"),
                        supportLine());
        sendBrandedEmail(application.getEmail(),
                "Frais de dépôt à régler - Demande d'accréditation ALGERAC", content);
    }

    public void sendOECAccountCreatedEmail(OECApplication application, String generatedPassword) {
        try {
            LinkedHashMap<String, String> rows = new LinkedHashMap<>();
            rows.put("Organisme", application.getNomOrganisme());
            rows.put("Type", safe(application.getTypeOrganisme()));
            rows.put("Représentant", safe(application.getNomRepresentant()));
            rows.put("Téléphone", safe(application.getTelephone()));
            rows.put("Adresse", safe(application.getAdresseSiege()));

            String content = """
                    <p>Bonjour,</p>
                    <p>Nous avons le plaisir de vous informer que votre compte sur la plateforme ALGERAC a été créé avec
                       succès pour l'organisme <strong>« %s »</strong>.</p>
                    %s
                    %s
                    %s
                    <p>Vous pouvez dès maintenant vous connecter à la plateforme ALGERAC et accéder à l'ensemble des
                       services disponibles.</p>
                    <p>Bienvenue sur la plateforme ALGERAC !</p>
                    """.formatted(application.getNomOrganisme(),
                            credentialsCard(application.getEmail(), generatedPassword),
                            calloutCard("Sécurité",
                                    "Nous vous recommandons vivement de changer votre mot de passe dès votre première connexion pour des raisons de sécurité.",
                                    "warning"),
                            detailsCard("Informations de votre organisme", rows));
            sendBrandedEmail(application.getEmail(),
                    "Votre compte ALGERAC a été créé - Bienvenue !", content);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de création de compte à {}", application.getEmail(), e);
            // Ne pas propager l'exception — le compte est déjà créé, ce n'est pas bloquant
            log.warn("Le compte a été créé mais l'email n'a pas pu être envoyé");
        }
    }

    public void sendOECPaymentExpiredRejection(OECApplication application) {
        LinkedHashMap<String, String> rows = new LinkedHashMap<>();
        rows.put("Montant dû", application.getDepositFeeAmount() != null
                ? application.getDepositFeeAmount().toPlainString() + " DA" : "N/A");
        rows.put("Date limite de paiement", application.getPaymentDeadline() != null
                ? application.getPaymentDeadline().format(DATE_FMT) : "N/A");

        String content = """
                <p>Bonjour,</p>
                <p>Nous vous informons que votre demande d'accréditation pour l'organisme <strong>« %s »</strong>
                   a été clôturée en raison du non-règlement des frais de dépôt dans le délai imparti.</p>
                %s
                %s
                <p>Si vous souhaitez poursuivre votre démarche d'accréditation, vous êtes invité(e) à déposer une
                   nouvelle demande sur la plateforme ALGERAC.</p>
                %s
                """.formatted(application.getNomOrganisme(),
                        detailsCard(null, rows),
                        calloutCard("Motif",
                                "Frais de dépôt non réglés dans le délai d'un mois.", "danger"),
                        supportLine());
        sendBrandedEmail(application.getEmail(),
                "Demande d'accréditation clôturée - Frais non réglés - ALGERAC", content);
    }

    /**
     * Generic HTML email sender — used by callers (e.g. ComplaintService) that pass
     * INNER content HTML which will be wrapped in the ALGERAC branded chrome.
     * This keeps every email in the project consistent with the same header & footer.
     */
    public void sendGenericEmail(String recipientEmail, String subject, String htmlBody) {
        try {
            sendBrandedEmail(recipientEmail, subject, htmlBody);
        } catch (Exception e) {
            log.error("Failed to send generic email to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
