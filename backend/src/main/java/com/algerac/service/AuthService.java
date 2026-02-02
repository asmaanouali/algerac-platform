package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.User;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Transactional
    public User registerOEC(OECSignupRequest request) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }
        
        // Créer un nouvel utilisateur OEC
        User user = User.builder()
                .userType("OEC")
                .nomOrganisme(request.getNomOrganisme())
                .typeOrganisme(request.getTypeOrganisme())
                .adresseSiege(request.getAdresseSiege())
                .telephone(request.getTelephone())
                .email(request.getEmail())
                .nomRepresentant(request.getNomRepresentant())
                .fonction(request.getFonction())
                .telephoneDirect(request.getTelephoneDirect())
                .emailProfessionnel(request.getEmailProfessionnel())
                .porteeAccreditation(request.getPorteeAccreditation())
                .status("PENDING")
                .build();
        
        // Sauvegarder l'utilisateur
        user = userRepository.save(user);
        
        log.info("Nouvel OEC enregistré : {}", user.getNomOrganisme());
        
        try {
            // Envoyer l'email de notification à l'admin
            emailService.sendOECRegistrationNotification(user);
            log.info("Email de notification envoyé à l'admin pour OEC : {}", user.getNomOrganisme());
            
            // Envoyer l'email de confirmation à l'utilisateur
            emailService.sendConfirmationToUser(user);
            log.info("Email de confirmation envoyé à l'utilisateur : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi des emails : {}", e.getMessage());
            // On continue même si l'email échoue, l'utilisateur est déjà enregistré
        }
        
        return user;
    }
    
    @Transactional
    public User registerExpert(ExpertSignupRequest request) {
        // Vérifier si l'email existe déjà
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }
        
        // Créer un nouvel utilisateur Expert
        User user = User.builder()
                .userType("EXPERT")
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .specialite(request.getSpecialite())
                .experience(request.getExperience())
                .diplomes(request.getDiplomes())
                .langues(request.getLangues())
                .disponibilite(request.getDisponibilite())
                .status("PENDING")
                .build();
        
        // Sauvegarder l'utilisateur
        user = userRepository.save(user);
        
        log.info("Nouvel Expert enregistré : {} {}", user.getNom(), user.getPrenom());
        
        try {
            // Envoyer l'email de notification à l'admin
            emailService.sendExpertRegistrationNotification(user);
            log.info("Email de notification envoyé à l'admin pour Expert : {} {}", user.getNom(), user.getPrenom());
            
            // Envoyer l'email de confirmation à l'utilisateur
            emailService.sendConfirmationToUser(user);
            log.info("Email de confirmation envoyé à l'utilisateur : {}", user.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi des emails : {}", e.getMessage());
            // On continue même si l'email échoue, l'utilisateur est déjà enregistré
        }
        
        return user;
    }
}
