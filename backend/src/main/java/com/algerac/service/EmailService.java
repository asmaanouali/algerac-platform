package com.algerac.service;

import com.algerac.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.notification.email}")
    private String notificationEmail;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
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
    
    public void sendExpertRegistrationNotification(User user) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(notificationEmail);
        message.setSubject("Nouvelle inscription Expert - " + user.getNom() + " " + user.getPrenom());
        
        String emailBody = String.format("""
            Nouvelle demande d'inscription Expert reçue :
            
            === INFORMATIONS PERSONNELLES ===
            Nom : %s
            Prénom : %s
            Email : %s
            Téléphone : %s
            
            === QUALIFICATIONS ===
            Spécialité : %s
            Expérience : %s
            Diplômes : %s
            Langues : %s
            Disponibilité : %s
            
            Date d'inscription : %s
            Status : %s
            
            ---
            Cette demande nécessite votre approbation.
            """,
            user.getNom(),
            user.getPrenom(),
            user.getEmail(),
            user.getPhone(),
            user.getSpecialite(),
            user.getExperience() != null ? user.getExperience() : "Non spécifiée",
            user.getDiplomes() != null ? user.getDiplomes() : "Non spécifiés",
            user.getLangues() != null ? user.getLangues() : "Non spécifiées",
            user.getDisponibilite() != null ? user.getDisponibilite() : "Non spécifiée",
            user.getCreatedAt(),
            user.getStatus()
        );
        
        message.setText(emailBody);
        
        mailSender.send(message);
    }
    
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