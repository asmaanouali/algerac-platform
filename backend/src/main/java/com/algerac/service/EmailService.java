
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

import java.time.LocalDateTime;
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
        log.info("[EMAIL SERVICE] Début sendOtpResetPassword pour {} (OTP: {})", user.getEmail(), otp);
        try {
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
            log.info("OTP email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email OTP à {}", user.getEmail(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email OTP", e);
        }
    }

    /**
     * Envoie une notification d'inscription OEC avec PDF
     */
    /**
     * Envoie une notification d'inscription OEC avec PDF DOC1 en pièce jointe
     */
    public void sendOECRegistrationNotification(User user) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(notificationEmail);
            
            String subject = String.format("[OEC] Nouvelle inscription - %s", user.getOrganizationName());
            helper.setSubject(subject);

            String emailBody = buildOECEmailBody(user);
            helper.setText(emailBody, false);

            // Génération et ajout du PDF DOC1 en pièce jointe
            byte[] pdfBytes = pdfGenerationService.generateDoc1Pdf(user);
            String filename = String.format("DOC1_%s_%s.pdf",
                user.getOrganizationName().replaceAll("[^a-zA-Z0-9]", "_"),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()));

            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

            mailSender.send(mimeMessage);
            log.info("Email OEC avec PDF DOC1 envoyé pour {}", user.getOrganizationName());

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email OEC avec PDF", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email OEC", e);
        }
    }

    /**
     * Construit le corps de l'email pour l'inscription OEC
     */
    private String buildOECEmailBody(User user) {
        return "Une nouvelle demande d'inscription OEC a été reçue.\n\n" +
               "Cette demande nécessite votre approbation.\n" +
               "Le formulaire DOC 1 complet est en pièce jointe de cet email.";
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
            // Ajout de l'ID d'inscription dans l'objet du mail
            String subject = String.format("[%s] Nouvelle inscription %s - %s %s", user.getRegistrationId(), typeLabel, user.getNom(), user.getPrenom());
            helper.setSubject(subject);


                String emailBody = buildExpertEmailBody(user);
                helper.setText(emailBody, false);

                // Génération et ajout du PDF en pièce jointe avec l'ID dans le nom
                byte[] pdfBytes = pdfGenerationService.generateFor20Pdf(user);
                String filename = String.format("FOR_20_%s_%s_%s_%s.pdf",
                    user.getRegistrationId(),
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
        return "Une nouvelle demande d'inscription a été reçue.\n\n" +
               "Cette demande nécessite votre approbation.\n" +
               "Le formulaire FOR 20 complet est en pièce jointe de cet email.";
    }

    /**
     * Envoie un email de confirmation à l'utilisateur
     */
    public void sendConfirmationToUser(User user) {
        try {
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
            log.info("Confirmation email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation à {}", user.getEmail(), e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de confirmation", e);
        }
    }
}