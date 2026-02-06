
package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final PdfGenerationService pdfGenerationService;

    @Value("${app.notification.email}")
    private String notificationEmail;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Envoie un code OTP pour la réinitialisation du mot de passe
     */
    public void sendOtpResetPassword(User user, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Réinitialisation du mot de passe - ALGERAC");
        String body = String.format("""
                Bonjour %s,

                Vous avez demandé la réinitialisation de votre mot de passe.
                Voici votre code de vérification (OTP) : %s

                Ce code est valable 15 minutes.

                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

                Cordialement,
                L'équipe ALGERAC
                """, user.getFullName(), otp);
        message.setText(body);
        mailSender.send(message);
    }

    /**
     * Envoie une notification d'inscription OEC avec PDF
     */
    public void sendOECRegistrationNotification(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(notificationEmail);
        message.setSubject("Nouvelle inscription OEC - " + user.getOrganizationName());

        String emailBody = String.format("""
            Nouvelle demande d'inscription OEC reçue :
            
            === INFORMATIONS ORGANISME ===
            Nom de l'organisme : %s
            Type : %s
            Adresse du siège : %s
            Téléphone : %s
            Email : %s
            
            === REPRÉSENTANT LÉGAL ===
            Nom : %s
            Fonction : %s
            Téléphone direct : %s
            Email professionnel : %s
            
            === PORTÉE D'ACCRÉDITATION ===
            %s
            
            Date d'inscription : %s
            Status : %s
            
            ---
            Cette demande nécessite votre approbation.
            """,
            user.getOrganizationName(),
            user.getTypeOrganisme(),
            user.getAdresseSiege(),
            user.getPhone(),
            user.getEmail(),
            user.getNomRepresentant(),
            user.getFonction(),
            user.getTelephoneDirect(),
            user.getEmailProfessionnel(),
            user.getPorteeAccreditation() != null ? user.getPorteeAccreditation() : "Non spécifiée",
            user.getCreatedAt(),
            user.getStatus()
        );

        message.setText(emailBody);
        mailSender.send(message);
    }

    /**
     * Envoie une notification d'inscription Expert avec PDF FOR 20 en pièce jointe
     */
    public void sendExpertRegistrationNotification(User user) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(notificationEmail);

            // Déterminer le label à partir du userType uniquement
            String typeLabel = "Expert";
            if (user.getUserType() != null) {
                switch (user.getUserType().toUpperCase()) {
                    case "FORMATEUR":
                        typeLabel = "Formateur";
                        break;
                    case "EVALUATEUR":
                        typeLabel = "Évaluateur";
                        break;
                    case "EXPERT":
                    default:
                        typeLabel = "Expert";
                }
            }
            helper.setSubject("Nouvelle inscription " + typeLabel + " - " + user.getNom() + " " + user.getPrenom());

            String emailBody = buildExpertEmailBody(user);
            helper.setText(emailBody, false);

            // Génération et ajout du PDF en pièce jointe
            byte[] pdfBytes = pdfGenerationService.generateFor20Pdf(user);
            String filename = String.format("FOR_20_%s_%s_%s.pdf",
                    user.getNom(),
                    user.getPrenom(),
                    DateTimeFormatter.ofPattern("yyyyMMdd").format(java.time.LocalDateTime.now()));

            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

            mailSender.send(mimeMessage);
            log.info("Email avec PDF envoyé pour {} {} ({}).", user.getNom(), user.getPrenom(), typeLabel);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec PDF", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    /**
     * Construit le corps de l'email pour l'inscription expert
     */
    private String buildExpertEmailBody(User user) {
        StringBuilder body = new StringBuilder();

        body.append("Nouvelle demande d'inscription Expert reçue :\n\n");

        // Section 1: Identification
        body.append("=== IDENTIFICATION ===\n");
        body.append(String.format("Nom : %s\n", user.getNom()));
        body.append(String.format("Prénom : %s\n", user.getPrenom()));
        body.append(String.format("Date de naissance : %s\n", user.getDateNaissance()));
        body.append(String.format("Nationalité : %s\n", user.getNationalite()));
        if (user.getSituationFamiliale() != null) {
            body.append(String.format("Situation familiale : %s\n\n", user.getSituationFamiliale()));
        }

        // Section 2: Contacts
        body.append("=== CONTACTS ===\n");
        body.append(String.format("Email : %s\n", user.getEmail()));
        body.append(String.format("Téléphone : %s\n", user.getPhone()));
        if (user.getTelephoneMobile() != null) {
            body.append(String.format("Mobile : %s\n", user.getTelephoneMobile()));
        }
        if (user.getAdresseDomicile() != null) {
            body.append(String.format("Adresse : %s\n", user.getAdresseDomicile()));
        }
        body.append("\n");

        // Section 3: Domaine d'expertise
        body.append("=== DOMAINE D'EXPERTISE ===\n");
        body.append(String.format("Domaine : %s\n", user.getDomaineExpertise()));
        if (user.getSousDomaineExpertise() != null) {
            body.append(String.format("Sous-domaine : %s\n", user.getSousDomaineExpertise()));
        }
        body.append("\n");

        // Métadonnées
        body.append(String.format("Date d'inscription : %s\n", user.getCreatedAt()));
        body.append(String.format("Status : %s\n\n", user.getStatus()));

        body.append("---\n");
        body.append("Cette demande nécessite votre approbation.\n");
        body.append("Le formulaire FOR 20 complet est en pièce jointe de cet email.\n");

        return body.toString();
    }

    /**
     * Envoie un email de confirmation à l'utilisateur
     */
    public void sendConfirmationToUser(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Confirmation d'inscription - ALGERAC");

        String emailBody = String.format("""
            Bonjour %s,
            
            Votre demande d'inscription sur la plateforme ALGERAC a bien été reçue.
            
            Votre dossier est actuellement en cours d'examen. Vous recevrez un email de confirmation
            dès que votre compte sera approuvé par notre équipe.
            
            Si vous avez des questions, n'hésitez pas à nous contacter.
            
            Cordialement,
            L'équipe ALGERAC
            """,
            user.getFullName()
        );

        message.setText(emailBody);
        mailSender.send(message);
    }
}