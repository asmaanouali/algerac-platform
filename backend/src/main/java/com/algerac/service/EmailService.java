
package com.algerac.service;

import com.algerac.model.OECApplication;
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

    @Value("${app.dt.email}")
    private String dtEmail;

    @Value("${app.ges.competences.email}")
    private String gesCompetencesEmail;

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
     * Envoie une notification d'inscription OEC avec PDF DOC1 en pièce jointe
     * Destinataire : Direction Technique (DT)
     */
    public void sendOECRegistrationNotification(User user) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(dtEmail);  // Envoyer à DT
            
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
            log.info("Email OEC avec PDF DOC1 envoyé à DT pour {}", user.getOrganizationName());

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
     * Envoie un email de rejet de demande à l'OEC
     */
    public void sendRejectionEmail(com.algerac.model.AccreditationRequest request, String reason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(request.getOec().getEmail());
            message.setSubject("Demande non recevable - " + request.getReferenceNumber());
            
            String body = String.format("""
                Bonjour %s,

                Nous vous informons que votre demande d'accréditation %s a été déclarée non recevable.

                Raison du rejet : %s

                Veuillez vous connecter à votre compte sur la plateforme ALGERAC pour consulter les détails 
                et prendre les mesures nécessaires pour régulariser votre dossier.

                Pour toute question, n'hésitez pas à nous contacter.

                Cordialement,
                L'équipe ALGERAC
                """, 
                request.getOec().getOrganizationName(),
                request.getReferenceNumber(),
                reason
            );
            
            message.setText(body);
            mailSender.send(message);
            log.info("Email de rejet envoyé à {} pour la demande {}", 
                    request.getOec().getEmail(), request.getReferenceNumber());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet", e);
        }
    }

    /**
     * Envoie une notification d'inscription Expert avec PDF FOR 20 en pièce jointe
     * Destinataire : Gestionnaire de Compétences (GES_COMPETENCES)
     */
    public void sendExpertRegistrationNotification(User user) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(gesCompetencesEmail);  // Envoyer à GES_COMPETENCES


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

                // Génération et ajout du PDF FOR20 en pièce jointe avec l'ID dans le nom
                byte[] pdfBytes = pdfGenerationService.generateFor20Pdf(user);
                String filename = String.format("FOR_20_%s_%s_%s_%s.pdf",
                    user.getRegistrationId(),
                    user.getNom(),
                    user.getPrenom(),
                    DateTimeFormatter.ofPattern("yyyyMMdd").format(java.time.LocalDateTime.now()));

                helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

            mailSender.send(mimeMessage);
            log.info("Email avec PDF FOR20 envoyé à GES_COMPETENCES pour {} {} ({}).", user.getNom(), user.getPrenom(), typeLabel);

        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec PDF", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    /**
     * Construit le corps de l'email pour l'inscription expert
     */
    private String buildExpertEmailBody(User user) {
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
        
        return String.format("""
            Bonjour,
            
            Une nouvelle candidature %s a été reçue :
            
             ID : %s
             Nom complet : %s %s
             Email : %s
             Téléphone : %s
             Domaine d'expertise : %s
             Date de candidature : %s
            
            Le formulaire FOR 20 complet est disponible en pièce jointe.
            
            Cordialement,
            Système ALGERAC
            """,
            typeLabel,
            user.getRegistrationId(),
            user.getPrenom(),
            user.getNom(),
            user.getEmail(),
            user.getPhone() != null ? user.getPhone() : "Non renseigné",
            user.getDomaineExpertise() != null ? user.getDomaineExpertise() : "Non renseigné",
            user.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
        );
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
    
    // ============================================
    // NOUVEAUX EMAILS POUR LE WORKFLOW OEC
    // ============================================
    
    /**
     * Envoie une notification au DT lors d'une nouvelle candidature OEC avec DOC1 en pièce jointe
     * UNIQUEMENT envoyé au DT (pas à l'admin)
     */
    public void sendOECApplicationNotificationToDT(OECApplication application) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(dtEmail);  // Envoyer UNIQUEMENT au DT
            helper.setSubject(String.format("[OEC] Nouvelle demande d'inscription - %s", application.getNomOrganisme()));
            
            String emailBody = String.format("""
                Bonjour,
                
                Une nouvelle demande d'inscription OEC a été reçue et nécessite votre approbation.
                Le formulaire DOC1 complet est joint à cet email.
                
                 Informations de la demande :
                ID de la demande : #%d
                Organisme : %s
                Email : %s
                Téléphone : %s
                Représentant : %s
                Date de candidature : %s
                
                Veuillez consulter cette demande sur la plateforme pour l'approuver ou la refuser.
                
                Lien : http://localhost:5173/dt/candidatures-oec
                
                Cordialement,
                Système ALGERAC
                """,
                application.getId(),
                application.getNomOrganisme(),
                application.getEmail(),
                application.getTelephone() != null ? application.getTelephone() : "Non renseigné",
                application.getNomRepresentant() != null ? application.getNomRepresentant() : "Non renseigné",
                application.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            helper.setText(emailBody, false);

            // Génération et ajout du PDF DOC1 en pièce jointe
            byte[] pdfBytes = pdfGenerationService.generateOECApplicationPdf(application);
            String filename = String.format("DOC1_%s_%s.pdf",
                application.getNomOrganisme().replaceAll("[^a-zA-Z0-9]", "_"),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()));

            helper.addAttachment(filename, new ByteArrayResource(pdfBytes));

            mailSender.send(mimeMessage);
            log.info("Email de notification DT avec DOC1 envoyé pour la candidature OEC #{}", application.getId());
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email au DT", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email au DT", e);
        }
    }
    
    /**
     * Envoie une confirmation au candidat OEC
     */
    public void sendOECApplicationConfirmationToCandidate(OECApplication application) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Confirmation de votre demande d'accréditation - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour,
                
                Votre demande d'accréditation OEC pour l'organisme "%s" a bien été reçue.
                
                 Numéro de demande : #%d
                 Date de dépôt : %s
                
                Votre dossier est actuellement en cours d'examen par notre équipe technique.
                Vous recevrez une notification par email dès qu'une décision sera prise concernant votre candidature.
                
                Si vous avez des questions, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                application.getNomOrganisme(),
                application.getId(),
                application.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de confirmation envoyé au candidat OEC : {}", application.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation au candidat", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de confirmation", e);
        }
    }
    
    /**
     * Envoie un email de refus au candidat OEC
     */
    public void sendOECApplicationRejectionToCandidate(OECApplication application, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Décision concernant votre demande d'accréditation - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous avons examiné votre demande d'accréditation pour l'organisme "%s".
                
                Après étude de votre dossier, nous sommes au regret de vous informer que votre demande 
                n'a pas pu être acceptée pour le(s) motif(s) suivant(s) :
                
                 Motif de refus :
                %s
                
                Si vous souhaitez obtenir des informations complémentaires ou déposer une nouvelle demande 
                après avoir pris en compte les observations, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                application.getNomOrganisme(),
                rejectionReason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de refus envoyé au candidat OEC : {}", application.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de refus au candidat", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de refus", e);
        }
    }
    
    /**
     * Envoie une notification à l'admin lorsqu'une candidature OEC est approuvée par le DT
     */
    public void sendOECApplicationApprovedNotificationToAdmin(OECApplication application) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(notificationEmail);
            message.setSubject(String.format("[OEC] Candidature approuvée - Action requise pour %s", application.getNomOrganisme()));
            
            String emailBody = String.format("""
                Bonjour Administrateur,
                
                Une candidature OEC a été approuvée par le DT et nécessite la création d'un compte utilisateur :
                
                 ID de la demande : #%d
                 Organisme : %s
                 Email : %s
                 Téléphone : %s
                 Représentant : %s
                 Approuvé le : %s
                
                Veuillez créer le compte utilisateur pour cet organisme sur la plateforme.
                
                Lien : http://localhost:5173/admin/utilisateurs-pending
                
                Cordialement,
                Système ALGERAC
                """,
                application.getId(),
                application.getNomOrganisme(),
                application.getEmail(),
                application.getTelephone() != null ? application.getTelephone() : "Non renseigné",
                application.getNomRepresentant() != null ? application.getNomRepresentant() : "Non renseigné",
                application.getReviewedByDtAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification Admin envoyé pour la candidature OEC #{}", application.getId());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à l'admin", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email à l'admin", e);
        }
    }

    /**
     * Envoie un email de confirmation d'approbation de candidature
     */
    public void sendCandidatureApprovedEmail(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Candidature approuvée - ALGERAC");
            
            String userTypeLabel = getUserTypeLabel(user);
            String emailBody = String.format("""
                Bonjour %s,
                
                Nous avons le plaisir de vous informer que votre candidature en tant que %s a été approuvée par notre Direction Technique.
                
                 Détails de votre candidature :
                   • Type : %s
                   • Email : %s
                   • Date de soumission : %s
                   • Date d'approbation : %s
                
                Votre compte est maintenant actif. Vous pouvez vous connecter à la plateforme ALGERAC avec vos identifiants.
                
                Se connecter : http://localhost:5173/auth/login
                
                Bienvenue dans l'équipe ALGERAC !
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getFullName(),
                userTypeLabel,
                userTypeLabel,
                user.getEmail(),
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")),
                user.getDateApprobation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email d'approbation envoyé à {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'approbation", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email d'approbation", e);
        }
    }

    /**
     * Envoie un email de rejet de candidature avec motif
     */
    public void sendCandidatureRejectedEmail(User user, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Candidature non retenue - ALGERAC");
            
            String userTypeLabel = getUserTypeLabel(user);
            String emailBody = String.format("""
                Bonjour %s,
                
                Nous vous remercions pour votre intérêt à rejoindre ALGERAC en tant que %s.
                
                Après examen attentif de votre candidature par notre Direction Technique, nous sommes au regret de vous informer que celle-ci n'a pas été retenue.
                
                Détails de votre candidature :
                   • Type : %s
                   • Email : %s
                   • Date de soumission : %s
                
                Motif du refus :
                %s
                
                Nous vous encourageons à réexaminer les critères requis et à soumettre une nouvelle candidature ultérieurement si vous le souhaitez.
                
                Pour toute question, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getFullName(),
                userTypeLabel,
                userTypeLabel,
                user.getEmail(),
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")),
                rejectionReason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de rejet envoyé à {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet", e);
        }
    }

    /**
     * Retourne le label du type d'utilisateur
     */
    private String getUserTypeLabel(User user) {
        if (user.getRole() != null) {
            switch (user.getRole().name()) {
                case "OEC": return "Organisme d'Évaluation de la Conformité (OEC)";
                case "EXPERT": return "Expert";
                case "EVALUATEUR": return "Évaluateur";
                case "FORMATEUR": return "Formateur";
                default: return user.getRole().name();
            }
        }
        if (user.getUserType() != null) {
            return user.getUserType();
        }
        return "Candidat";
    }
    
    /**
     * Envoie une notification à l'admin qu'un OEC a été approuvé et nécessite la création de compte
     */
    public void sendOECApprovedNotificationToAdmin(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(notificationEmail);
            message.setSubject(String.format("[OEC] Candidature approuvée - Création de compte requise pour %s", user.getOrganizationName()));
            
            String emailBody = String.format("""
                Bonjour Administrateur,
                
                Une candidature OEC a été approuvée par la Direction Technique et nécessite maintenant la création d'un compte utilisateur :
                
                ID de l'utilisateur : #%d
                Organisme : %s
                Email : %s
                Téléphone : %s
                Représentant : %s
                Approuvé le : %s
                
                Veuillez vous connecter à la plateforme pour créer le compte utilisateur pour cet organisme.
                Les identifiants seront générés automatiquement et envoyés à l'OEC par email.
                
                Lien : http://localhost:5173/admin/oec-pending
                
                Cordialement,
                Système ALGERAC
                """,
                user.getId(),
                user.getOrganizationName(),
                user.getEmail(),
                user.getPhone() != null ? user.getPhone() : "Non renseigné",
                user.getNomRepresentant() != null ? user.getNomRepresentant() : "Non renseigné",
                user.getDateApprobation() != null ? user.getDateApprobation().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")) : "Maintenant"
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification Admin envoyé pour l'OEC #{}", user.getId());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email à l'admin", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email à l'admin", e);
        }
    }
    
    /**
     * Envoie les identifiants de connexion à l'OEC après création du compte par l'admin
     */
    public void sendOECAccountCredentials(User user, String generatedPassword) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Votre compte ALGERAC a été créé - Identifiants de connexion");
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous avons le plaisir de vous informer que votre demande d'accréditation pour l'organisme "%s" a été approuvée.
                
                Votre compte sur la plateforme ALGERAC est maintenant actif !
                
                Vos identifiants de connexion :
                   • Email : %s
                   • Mot de passe : %s
                
                Pour des raisons de sécurité, nous vous recommandons fortement de :
                   1. Vous connecter dès que possible
                   2. Changer votre mot de passe après la première connexion
                
                Se connecter à la plateforme : http://localhost:5173/auth/login
                
                Si vous n'êtes pas à l'origine de cette demande ou si vous avez des questions, veuillez nous contacter immédiatement.
                
                Bienvenue sur ALGERAC !
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getOrganizationName(),
                user.getEmail(),
                generatedPassword
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email avec identifiants envoyé à l'OEC : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email avec identifiants à l'OEC", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email avec identifiants", e);
        }
    }
    
    /**
     * Envoie un email de confirmation à l'OEC après soumission de sa demande
     */
    public void sendOECRegistrationConfirmation(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Confirmation de réception - Demande d'accréditation OEC");
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous avons bien reçu votre demande d'accréditation pour l'organisme "%s".
                
                Votre demande est actuellement en cours d'examen par notre Direction Technique.
                Vous serez informé(e) par email de l'évolution de votre dossier.
                
                Informations de votre demande :
                   • Organisme : %s
                   • Email : %s
                   • Date de soumission : %s
                
                Si vous avez des questions, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getOrganizationName(),
                user.getOrganizationName(),
                user.getEmail(),
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de confirmation OEC envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation OEC", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de confirmation", e);
        }
    }
    
    /**
     * Envoie une notification au DT qu'une nouvelle demande OEC a été soumise
     */
    public void sendDTNewOECNotification(User user) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo("orginag65msf@gmail.com"); // Email du DT
            message.setSubject("Nouvelle demande d'accréditation OEC - " + user.getOrganizationName());
            
            String emailBody = String.format("""
                Bonjour,
                
                Une nouvelle demande d'accréditation OEC a été soumise et nécessite votre examen.
                
                Informations de la demande :
                   • ID : #%d
                   • Organisme : %s
                   • Représentant : %s
                   • Email : %s
                   • Téléphone : %s
                   • Date de soumission : %s
                
                Veuillez vous connecter à la plateforme pour examiner la demande et le document DOC1.
                
                Cordialement,
                Système ALGERAC
                """,
                user.getId(),
                user.getOrganizationName(),
                user.getNomRepresentant() != null ? user.getNomRepresentant() : "Non renseigné",
                user.getEmail(),
                user.getPhone() != null ? user.getPhone() : "Non renseigné",
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification DT envoyé pour la demande OEC #{}", user.getId());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email au DT", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email au DT", e);
        }
    }
    
    /**
     * Envoie un email de rejet à l'OEC lorsque le DT rejette sa demande
     */
    public void sendOECRejectionByDT(User user, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Demande d'accréditation non retenue - " + user.getOrganizationName());
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous vous informons que votre demande d'accréditation pour l'organisme "%s" n'a pas été retenue par notre Direction Technique.
                
                Motif du rejet :
                %s
                
                Si vous souhaitez obtenir plus d'informations ou soumettre une nouvelle demande après avoir pris en compte ces observations, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getOrganizationName(),
                rejectionReason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de rejet DT envoyé à l'OEC : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet à l'OEC", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet", e);
        }
    }
    
    /**
     * Envoie un email de confirmation à l'expert/évaluateur/formateur après soumission
     */
    public void sendExpertRegistrationConfirmation(User user) {
        try {
            String typeLabel = "Expert";
            if (user.getUserType() != null) {
                switch (user.getUserType().toUpperCase()) {
                    case "FORMATEUR":
                        typeLabel = "Formateur";
                        break;
                    case "EVALUATEUR":
                        typeLabel = "Évaluateur";
                        break;
                }
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Confirmation de réception - Candidature " + typeLabel);
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous avons bien reçu votre candidature en tant que %s.
                
                Votre dossier est actuellement en cours d'examen par notre service de Gestion des Compétences.
                Vous serez informé(e) par email de l'évolution de votre candidature.
                
                Informations de votre candidature :
                   • ID : %s
                   • Nom complet : %s %s
                   • Email : %s
                   • Domaine d'expertise : %s
                   • Date de soumission : %s
                
                Si vous avez des questions, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel,
                user.getRegistrationId(),
                user.getPrenom(),
                user.getNom(),
                user.getEmail(),
                user.getDomaineExpertise() != null ? user.getDomaineExpertise() : "Non renseigné",
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de confirmation {} envoyé à : {}", typeLabel, user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation expert", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de confirmation", e);
        }
    }
    
    /**
     * Envoie une notification au gestionnaire de compétences pour une nouvelle candidature
     */
    public void sendGesCompetencesNotification(User user) {
        try {
            String typeLabel = "Expert";
            if (user.getUserType() != null) {
                switch (user.getUserType().toUpperCase()) {
                    case "FORMATEUR":
                        typeLabel = "Formateur";
                        break;
                    case "EVALUATEUR":
                        typeLabel = "Évaluateur";
                        break;
                }
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo("caroziiinya@gmail.com"); // Email du gestionnaire de compétences
            message.setSubject("Nouvelle candidature " + typeLabel + " - " + user.getNom() + " " + user.getPrenom());
            
            String emailBody = String.format("""
                Bonjour,
                
                Une nouvelle candidature %s a été soumise et nécessite votre examen.
                
                Informations du candidat :
                   • ID : %s
                   • Nom complet : %s %s
                   • Email : %s
                   • Téléphone : %s
                   • Domaine d'expertise : %s
                   • Date de soumission : %s
                
                Veuillez vous connecter à la plateforme pour examiner la candidature et le formulaire FOR20 :
                http://localhost:5173/dt/candidatures
                
                Cordialement,
                Système ALGERAC
                """,
                typeLabel,
                user.getRegistrationId(),
                user.getPrenom(),
                user.getNom(),
                user.getEmail(),
                user.getPhone() != null ? user.getPhone() : "Non renseigné",
                user.getDomaineExpertise() != null ? user.getDomaineExpertise() : "Non renseigné",
                user.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"))
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification Ges Compétences envoyé pour la candidature {}", user.getRegistrationId());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email au gestionnaire de compétences", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email au gestionnaire", e);
        }
    }
    
    /**
     * Envoie un email de rejet à l'expert/évaluateur/formateur
     */
    public void sendExpertRejectionByGesCompetences(User user, String rejectionReason) {
        try {
            String typeLabel = "Expert";
            if (user.getUserType() != null) {
                switch (user.getUserType().toUpperCase()) {
                    case "FORMATEUR":
                        typeLabel = "Formateur";
                        break;
                    case "EVALUATEUR":
                        typeLabel = "Évaluateur";
                        break;
                }
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Candidature non retenue - " + typeLabel);
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous vous informons que votre candidature en tant que %s n'a pas été retenue.
                
                Motif :
                %s
                
                Nous vous remercions pour l'intérêt que vous portez à ALGERAC.
                Si vous souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel,
                rejectionReason
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de rejet {} envoyé à : {}", typeLabel, user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet expert", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet", e);
        }
    }
    
    /**
     * Envoie une notification à l'admin quand un expert/évaluateur/formateur est approuvé
     * L'admin doit créer le compte
     */
    public void sendExpertApprovedNotificationToAdmin(User user) {
        try {
            String typeLabel = "Expert";
            if (user.getUserType() != null) {
                switch (user.getUserType().toUpperCase()) {
                    case "FORMATEUR":
                        typeLabel = "Formateur";
                        break;
                    case "EVALUATEUR":
                        typeLabel = "Évaluateur";
                        break;
                }
            }
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(notificationEmail); // Email de l'admin
            message.setSubject(String.format("[ACTION REQUISE] Nouveau %s approuvé - %s %s", typeLabel, user.getNom(), user.getPrenom()));
            
            String emailBody = String.format("""
                Bonjour Administrateur,
                
                Une nouvelle candidature %s a été approuvée par le Gestionnaire de Compétences.
                
                Informations :
                - ID d'inscription : %s
                - Nom : %s %s
                - Email : %s
                - Téléphone : %s
                - Domaine d'expertise : %s
                
                Veuillez vous connecter à la plateforme pour créer le compte utilisateur.
                
                Cordialement,
                Système ALGERAC
                """,
                typeLabel,
                user.getRegistrationId(),
                user.getPrenom(),
                user.getNom(),
                user.getEmail(),
                user.getTelephoneMobile() != null ? user.getTelephoneMobile() : user.getPhone(),
                user.getDomaineExpertise()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification admin envoyé pour {} {} ({})", user.getPrenom(), user.getNom(), typeLabel);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de notification admin", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de notification admin", e);
        }
    }
}
