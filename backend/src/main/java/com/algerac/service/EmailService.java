
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

    @Value("${app.dag.email:asmaanouali256@gmail.com}")
    private String dagEmail;

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
     * Ton professionnel, mentionne que le profil sera évalué par rapport aux besoins actuels
     */
    public void sendExpertRegistrationConfirmation(User user) {
        try {
            String typeLabel = getExpertTypeLabel(user);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Accusé de réception de votre candidature - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous accusons réception de votre candidature en tant que %s au sein de l'organisme ALGERAC.
                
                Nous vous remercions pour l'intérêt que vous portez à notre organisation et pour le temps consacré à la constitution de votre dossier.
                
                Votre profil sera examiné avec attention par notre équipe de Gestion des Compétences afin d'évaluer son adéquation avec nos besoins actuels en matière d'accréditation et d'évaluation de la conformité.
                
                Référence de votre candidature : %s
                
                Si votre profil correspond à nos critères de sélection, vous serez contacté(e) pour la suite du processus de recrutement. Dans tous les cas, nous vous tiendrons informé(e) de l'évolution de votre candidature.
                
                Nous vous prions de bien vouloir noter que le traitement de votre dossier peut prendre quelques jours ouvrables.
                
                Pour toute question relative à votre candidature, n'hésitez pas à nous contacter.
                
                Cordialement,
                
                Service de Gestion des Compétences
                ALGERAC - Organisme Algérien d'Accréditation
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel,
                user.getRegistrationId()
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
                
                Veuillez vous connecter à la plateforme pour examiner la candidature et le formulaire FOR20
                
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
     * Envoie un email de rejet IMPLICITE/OPTIMISTE à l'expert/évaluateur/formateur
     * quand le dossier n'est pas retenu (avant entretien)
     */
    public void sendExpertRejectionByGesCompetences(User user, String rejectionReason) {
        sendExpertDossierNotRetained(user);
    }
    
    /**
     * Email de refus implicite - dossier non retenu (avant entretien) 
     * Ton optimiste, pas de mention directe de "rejet"
     */
    public void sendExpertDossierNotRetained(User user) {
        try {
            String typeLabel = getExpertTypeLabel(user);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Suite donnée à votre candidature - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous tenons à vous remercier sincèrement pour l'intérêt que vous portez à ALGERAC et pour le temps que vous avez consacré à la constitution de votre dossier de candidature en tant que %s.
                
                Après un examen attentif de votre profil, nous avons le regret de vous informer que votre candidature n'a pas pu être retenue dans le cadre de nos besoins actuels.
                
                Cette décision ne remet en aucun cas en question la qualité de votre parcours professionnel ni vos compétences. Nos critères de sélection sont étroitement liés aux spécificités de nos programmes d'accréditation en cours et à la configuration de nos équipes d'évaluation.
                
                Votre dossier sera conservé dans notre vivier de compétences et pourra être reconsidéré lors de futures opportunités correspondant davantage à votre profil. Nous vous encourageons à suivre nos appels à candidatures et à renouveler votre intérêt le moment venu.
                
                Nous vous souhaitons plein succès dans la poursuite de votre parcours professionnel.
                
                Cordialement,
                
                Service de Gestion des Compétences
                ALGERAC - Organisme Algérien d'Accréditation
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de refus implicite (dossier) envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de refus implicite", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de refus", e);
        }
    }
    
    /**
     * Email de convocation à un entretien
     * Ton professionnel haut niveau, type big company
     */
    public void sendInterviewConvocationEmail(User user, java.time.LocalDateTime interviewDate) {
        try {
            String typeLabel = getExpertTypeLabel(user);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Convocation à un entretien - Candidature " + typeLabel + " ALGERAC");
            
            String formattedDate = interviewDate.format(DateTimeFormatter.ofPattern("EEEE dd MMMM yyyy 'à' HH'h'mm", java.util.Locale.FRENCH));
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous avons le plaisir de vous informer que votre profil a retenu toute notre attention dans le cadre de votre candidature en tant que %s au sein d'ALGERAC.
                
                À la suite de l'examen de votre dossier, nous souhaitons vous convier à un entretien de sélection afin d'approfondir notre connaissance de votre parcours, de vos compétences techniques et de votre adéquation avec les missions que nous proposons.
                
                ═══════════════════════════════════════
                  DÉTAILS DE L'ENTRETIEN
                ═══════════════════════════════════════
                
                  Date et heure : %s
                  Lieu : Siège ALGERAC
                  Référence : %s
                
                ═══════════════════════════════════════
                
                Nous vous prions de bien vouloir confirmer votre présence à cet entretien en répondant à ce mail dans les meilleurs délais. Si la date proposée ne vous convient pas, merci de nous proposer une alternative et nous ferons notre possible pour nous adapter.
                
                Documents à apporter le jour de l'entretien :
                   • Une pièce d'identité en cours de validité
                   • Les originaux de vos diplômes et certifications
                   • Tout document complémentaire attestant de votre expérience professionnelle
                
                Nous nous réjouissons de vous rencontrer et restons à votre disposition pour toute information complémentaire.
                
                Cordialement,
                
                Service de Gestion des Compétences
                ALGERAC - Organisme Algérien d'Accréditation
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel,
                formattedDate,
                user.getRegistrationId()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de convocation entretien envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de convocation", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de convocation", e);
        }
    }
    
    /**
     * Email de refus implicite après entretien
     * Ton très professionnel et optimiste, sans mentionner directement le rejet
     */
    public void sendExpertInterviewNotRetained(User user) {
        try {
            String typeLabel = getExpertTypeLabel(user);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Suite de votre processus de candidature - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous tenons à vous remercier chaleureusement pour le temps que vous nous avez accordé lors de notre entretien dans le cadre de votre candidature en tant que %s.
                
                Cet échange nous a permis de mieux apprécier la richesse de votre parcours professionnel et vos compétences techniques. Nous avons été sensibles à la qualité de votre profil et à votre motivation.
                
                Cependant, après une analyse approfondie de l'ensemble des candidatures reçues et au regard de la configuration actuelle de nos équipes d'évaluation, nous ne sommes pas en mesure de donner une suite favorable à votre candidature pour le moment.
                
                Nous tenons à souligner que cette décision est exclusivement liée à nos contraintes opérationnelles actuelles et ne reflète en rien un jugement sur vos qualifications professionnelles.
                
                Votre dossier sera conservé dans notre base de données de compétences qualifiées. Nous ne manquerons pas de vous recontacter si une opportunité correspondant à votre profil se présente à l'avenir. Nous vous encourageons également à consulter régulièrement nos appels à candidatures.
                
                Nous vous souhaitons beaucoup de succès dans la suite de votre parcours.
                
                Bien cordialement,
                
                Service de Gestion des Compétences
                ALGERAC - Organisme Algérien d'Accréditation
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de refus implicite (post-entretien) envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email post-entretien", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email post-entretien", e);
        }
    }
    
    /**
     * Email de félicitations et envoi des credentials après acceptation
     * Envoyé quand l'admin crée le compte après validation par GES_COMPETENCES
     */
    public void sendExpertAccountAccepted(User user, String generatedPassword) {
        try {
            String typeLabel = getExpertTypeLabel(user);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("Félicitations ! Votre candidature a été retenue - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour %s %s,
                
                Nous avons le grand plaisir de vous informer que votre candidature en tant que %s au sein d'ALGERAC a été retenue.
                
                Au terme de notre processus de sélection, votre profil a été jugé en parfaite adéquation avec nos exigences en matière de compétences techniques et d'expertise dans le domaine de l'accréditation et de l'évaluation de la conformité.
                
                Votre compte sur la plateforme ALGERAC est désormais actif. Vous trouverez ci-dessous vos identifiants de connexion :
                
                ═══════════════════════════════════════
                  VOS IDENTIFIANTS
                ═══════════════════════════════════════
                
                  Email : %s
                  Mot de passe : %s
                
                ═══════════════════════════════════════
                
                Actions recommandées :
                   1. Connectez-vous à la plateforme
                   2. Modifiez votre mot de passe dès votre première connexion
                   3. Complétez votre profil professionnel
                
                Notre équipe se tient à votre disposition pour vous accompagner dans vos premières étapes sur la plateforme.
                
                Bienvenue dans l'équipe ALGERAC !
                
                Cordialement,
                
                Service de Gestion des Compétences
                ALGERAC - Organisme Algérien d'Accréditation
                """,
                user.getPrenom(),
                user.getNom(),
                typeLabel,
                user.getEmail(),
                generatedPassword
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de félicitations avec credentials envoyé à : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de félicitations", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email d'acceptation", e);
        }
    }

    /**
     * Notification de recours (blacklist appeal) envoyée au gestionnaire de compétences
     */
    public void sendBlacklistAppealNotification(User gesUser, User blacklistedUser, String appealMessage) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(gesUser.getEmail());
            helper.setSubject("Recours d'un candidat blacklisté - " + blacklistedUser.getFullName());
            
            String body = String.format("""
                <h2>Recours reçu</h2>
                <p>Un candidat blacklisté a introduit un recours :</p>
                <ul>
                    <li><strong>Nom :</strong> %s</li>
                    <li><strong>Email :</strong> %s</li>
                    <li><strong>Type :</strong> %s</li>
                    <li><strong>Motif de blacklist :</strong> %s</li>
                    <li><strong>Date de blacklist :</strong> %s</li>
                </ul>
                <h3>Message du candidat :</h3>
                <p>%s</p>
                <p>Veuillez examiner ce recours et prendre les mesures appropriées.</p>
                """,
                blacklistedUser.getFullName(),
                blacklistedUser.getEmail(),
                getExpertTypeLabel(blacklistedUser),
                blacklistedUser.getBlacklistReason() != null ? blacklistedUser.getBlacklistReason() : "Non spécifié",
                blacklistedUser.getBlacklistedAt() != null ? blacklistedUser.getBlacklistedAt().toString() : "Non spécifié",
                appealMessage
            );
            
            helper.setText(body, true);
            mailSender.send(mimeMessage);
            log.info("Email de notification de recours envoyé à {}", gesUser.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de recours : {}", e.getMessage());
        }
    }

    /**
     * Helper: get expert type label
     */
    private String getExpertTypeLabel(User user) {
        if (user.getUserType() == null) return "Expert";
        return switch (user.getUserType().toUpperCase()) {
            case "FORMATEUR" -> "Formateur";
            case "EVALUATEUR" -> "Évaluateur";
            default -> "Expert";
        };
    }

    /**
     * Envoie un email de confirmation de plainte au plaignant avec le code de suivi
     */
    public void sendComplaintConfirmationEmail(String recipientEmail, String complainantName, String trackingCode, String subject) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Confirmation de plainte - " + trackingCode + " | ALGERAC");

            String body = String.format("""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 20px 0; border-bottom: 3px solid #00A63E;">
                        <h1 style="color: #00A63E; margin: 0;">ALGERAC</h1>
                        <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Organisme Algérien d'Accréditation</p>
                    </div>
                    
                    <div style="padding: 30px 0;">
                        <p>Bonjour <strong>%s</strong>,</p>
                        
                        <p>Nous accusons réception de votre plainte et vous confirmons qu'elle a été enregistrée dans notre système.</p>
                        
                        <div style="background: #f0f7ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
                            <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">Votre code de suivi</p>
                            <p style="font-size: 28px; font-weight: bold; color: #1e40af; font-family: monospace; margin: 0; letter-spacing: 2px;">%s</p>
                            <p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">Conservez ce code précieusement pour suivre l'état de votre plainte</p>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px;"><strong>Objet :</strong> %s</p>
                        </div>
                        
                        <p>Votre plainte sera examinée par le Responsable Qualité d'ALGERAC conformément à la norme ISO 17011. 
                           Vous serez informé(e) de l'avancement du traitement.</p>
                        
                        <p>Vous pouvez à tout moment consulter l'état de votre plainte en vous rendant sur notre portail 
                           et en utilisant la fonction <strong>« Suivre ma plainte »</strong> avec votre code de suivi.</p>
                        
                        <p style="color: #666; font-size: 13px; margin-top: 30px;">
                            Pour toute question complémentaire, n'hésitez pas à nous contacter à 
                            <a href="mailto:support@algerac.dz" style="color: #00A63E;">support@algerac.dz</a>
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; color: #999; font-size: 12px;">
                        <p>ALGERAC — Organisme Algérien d'Accréditation</p>
                        <p>Site Web : <a href="https://algerac.dz" style="color: #00A63E;">algerac.dz</a></p>
                    </div>
                </div>
                """,
                complainantName,
                trackingCode,
                subject
            );

            helper.setText(body, true);
            mailSender.send(mimeMessage);
            log.info("Email de confirmation de plainte envoyé à {} (code: {})", recipientEmail, trackingCode);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de confirmation de plainte à {}: {}", recipientEmail, e.getMessage());
            // Don't throw - complaint should still be registered even if email fails
        }
    }
    
    // ===================================================================
    // WORKFLOW OEC - Emails pour le processus de candidature
    // ===================================================================
    
    /**
     * Email de rejet enrichi avec motif ET manquements.
     * Invite l'OEC à corriger et resoumettre une nouvelle demande.
     */
    public void sendOECApplicationRejectionWithDeficiencies(OECApplication application, String rejectionReason, String manquements) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Demande d'accréditation non retenue - ALGERAC");
            
            StringBuilder emailBody = new StringBuilder();
            emailBody.append(String.format("""
                Bonjour,
                
                Nous avons examiné votre demande d'accréditation pour l'organisme "%s".
                
                Après étude de votre dossier, nous sommes au regret de vous informer que votre demande 
                n'a pas pu être acceptée pour le(s) motif(s) suivant(s) :
                
                Motif de refus :
                %s
                """,
                application.getNomOrganisme(),
                rejectionReason
            ));
            
            if (manquements != null && !manquements.isBlank()) {
                emailBody.append(String.format("""
                
                Manquements identifiés :
                %s
                """, manquements));
            }
            
            emailBody.append("""
                
                Nous vous invitons à prendre en compte ces observations et à déposer une nouvelle demande 
                une fois les corrections effectuées.
                
                Pour déposer une nouvelle demande, rendez-vous sur la plateforme ALGERAC :
                https://algerac.dz/auth/register/oec
                
                Pour toute question, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """);
            
            message.setText(emailBody.toString());
            mailSender.send(message);
            log.info("Email de rejet avec manquements envoyé au candidat OEC : {}", application.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet au candidat", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet", e);
        }
    }
    
    /**
     * Email envoyé à l'OEC lorsque le DAG fixe les frais de dépôt.
     * Contient : montant à payer + email du DAG pour envoyer la preuve de paiement.
     */
    public void sendOECDepositFeeNotification(OECApplication application) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Frais de dépôt à régler - Demande d'accréditation ALGERAC");
            
            String emailBody = String.format("""
                Bonjour,
                
                Votre demande d'accréditation pour l'organisme "%s" a été approuvée par la Direction Technique d'ALGERAC.
                
                Pour poursuivre le traitement de votre dossier, vous êtes invité(e) à régler les frais de dépôt suivants :
                
                ═══════════════════════════════════════
                  FRAIS DE DÉPÔT
                ═══════════════════════════════════════
                
                  Montant : %s DA
                  Date limite de paiement : %s
                
                ═══════════════════════════════════════
                
                Modalités de paiement :
                Après avoir effectué le paiement, veuillez envoyer la preuve de paiement 
                (bordereau de virement, reçu de paiement, etc.) par email à l'adresse suivante :
                
                  Email : %s
                
                Veuillez mentionner le nom de votre organisme et votre numéro de candidature (#%d) 
                dans l'objet du mail.
                
                IMPORTANT : Vous disposez d'un délai d'un mois à compter de la réception de ce mail 
                pour effectuer le paiement. Passé ce délai, votre demande sera automatiquement rejetée.
                
                Pour toute question, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                application.getNomOrganisme(),
                application.getDepositFeeAmount().toPlainString(),
                application.getPaymentDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                dagEmail,
                application.getId()
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de notification frais de dépôt envoyé à l'OEC : {} (montant: {} DA)", 
                    application.getEmail(), application.getDepositFeeAmount());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de frais de dépôt", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de frais de dépôt", e);
        }
    }
    
    /**
     * Email de rejet automatique pour non-paiement (délai d'un mois dépassé).
     */
    /**
     * Envoie un email à l'OEC pour lui confirmer la création de son compte avec ses coordonnées de connexion
     */
    public void sendOECAccountCreatedEmail(OECApplication application) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Votre compte ALGERAC a été créé - Bienvenue !");
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous avons le plaisir de vous informer que votre compte sur la plateforme ALGERAC 
                a été créé avec succès pour l'organisme "%s".
                
                ═══════════════════════════════════════
                  VOS COORDONNÉES DE CONNEXION
                ═══════════════════════════════════════
                
                  Email de connexion : %s
                  Mot de passe : celui que vous avez choisi lors de votre inscription
                
                ═══════════════════════════════════════
                
                 Informations de votre organisme :
                  • Organisme : %s
                  • Type : %s
                  • Représentant : %s
                  • Téléphone : %s
                  • Adresse : %s
                
                Vous pouvez dès maintenant vous connecter à la plateforme ALGERAC 
                et accéder à l'ensemble des services disponibles.
                
                En cas d'oubli de mot de passe, utilisez la fonction "Mot de passe oublié" 
                sur la page de connexion.
                
                Bienvenue sur la plateforme ALGERAC !
                
                Cordialement,
                L'équipe ALGERAC
                """,
                application.getNomOrganisme(),
                application.getEmail(),
                application.getNomOrganisme(),
                application.getTypeOrganisme() != null ? application.getTypeOrganisme() : "Non renseigné",
                application.getNomRepresentant() != null ? application.getNomRepresentant() : "Non renseigné",
                application.getTelephone() != null ? application.getTelephone() : "Non renseigné",
                application.getAdresseSiege() != null ? application.getAdresseSiege() : "Non renseigné"
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de création de compte envoyé à l'OEC : {}", application.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de création de compte à {}", application.getEmail(), e);
            // Ne pas propager l'exception — le compte est déjà créé, ce n'est pas bloquant
            log.warn("Le compte a été créé mais l'email n'a pas pu être envoyé");
        }
    }

    public void sendOECPaymentExpiredRejection(OECApplication application) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(application.getEmail());
            message.setSubject("Demande d'accréditation clôturée - Frais non réglés - ALGERAC");
            
            String emailBody = String.format("""
                Bonjour,
                
                Nous vous informons que votre demande d'accréditation pour l'organisme "%s" 
                a été clôturée en raison du non-règlement des frais de dépôt dans le délai imparti.
                
                Montant dû : %s DA
                Date limite de paiement : %s
                
                Motif : Frais de dépôt non réglés dans le délai d'un mois.
                
                Si vous souhaitez poursuivre votre démarche d'accréditation, vous êtes invité(e) 
                à déposer une nouvelle demande sur la plateforme ALGERAC.
                
                Pour toute question, n'hésitez pas à nous contacter.
                
                Cordialement,
                L'équipe ALGERAC
                """,
                application.getNomOrganisme(),
                application.getDepositFeeAmount() != null ? application.getDepositFeeAmount().toPlainString() : "N/A",
                application.getPaymentDeadline() != null ? 
                        application.getPaymentDeadline().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A"
            );
            
            message.setText(emailBody);
            mailSender.send(message);
            log.info("Email de rejet pour non-paiement envoyé à l'OEC : {}", application.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email de rejet pour non-paiement", e);
            throw new RuntimeException("Erreur lors de l'envoi de l'email de rejet pour non-paiement", e);
        }
    }
}
