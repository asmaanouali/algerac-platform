package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public User registerOEC(OECSignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode("temp_password_" + System.currentTimeMillis())) // Temporary
                .fullName(request.getNomOrganisme())
                .role(UserRole.OEC)
                .organizationName(request.getNomOrganisme())
                .phone(request.getTelephone())
                .typeOrganisme(request.getTypeOrganisme())
                .adresseSiege(request.getAdresseSiege())
                .nomRepresentant(request.getNomRepresentant())
                .fonction(request.getFonction())
                .telephoneDirect(request.getTelephoneDirect())
                .emailProfessionnel(request.getEmailProfessionnel())
                .porteeAccreditation(request.getPorteeAccreditation())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        
        user = userRepository.save(user);
        log.info("Nouvel OEC enregistré : {}", user.getOrganizationName());
        
        try {
            emailService.sendOECRegistrationNotification(user);
            emailService.sendConfirmationToUser(user);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi des emails : {}", e.getMessage());
        }
        
        return user;
    }
    
    @Transactional
    public User registerExpert(ExpertSignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }
        
        String fullName = request.getPrenom() + " " + request.getNom();
        
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode("temp_password_" + System.currentTimeMillis())) // Temporary
            .fullName(fullName)
            .role(UserRole.EXPERT)
            .phone(request.getTelephone())
            // Section 1: Identification
            .nom(request.getNom())
            .prenom(request.getPrenom())
            .dateNaissance(request.getDateNaissance())
            .nationalite(request.getNationalite())
            .situationFamiliale(request.getSituationFamiliale())
            .photoBase64(request.getPhotoBase64())
            // Section 2: Contacts
            .telephoneMobile(request.getTelephoneMobile())
            .fax(request.getFax())
            .adresseDomicile(request.getAdresseDomicile())
            .adresseEntreprise(request.getAdresseEntreprise())
            .contactUrgenceNom(request.getContactUrgenceNom())
            .contactUrgenceTelephone(request.getContactUrgenceTelephone())
            .contactUrgenceMobile(request.getContactUrgenceMobile())
            // Domaine d'expertise
            .domaineExpertise(request.getDomaineExpertise())
            .sousDomaineExpertise(request.getSousDomaineExpertise())
            // Section 8: Divers
            .informationsComplementaires(request.getInformationsComplementaires())
            // Ajout userType
            .userType(request.getUserType())
            // Status
            .status("PENDING")
            .createdAt(LocalDateTime.now())
            .build();
        
        // Convertir les listes en JSON
        try {
            if (request.getFormationsAcademiques() != null) {
                user.setFormationsAcademiquesJson(
                    objectMapper.writeValueAsString(request.getFormationsAcademiques())
                );
            }
            if (request.getAutresFormations() != null) {
                user.setAutresFormationsJson(
                    objectMapper.writeValueAsString(request.getAutresFormations())
                );
            }
            if (request.getExperiencesProfessionnelles() != null) {
                user.setExperiencesProfessionnellesJson(
                    objectMapper.writeValueAsString(request.getExperiencesProfessionnelles())
                );
            }
            if (request.getEvaluationsAudits() != null) {
                user.setEvaluationsAuditsJson(
                    objectMapper.writeValueAsString(request.getEvaluationsAudits())
                );
            }
            if (request.getFormationsDispensees() != null) {
                user.setFormationsDispenseesJson(
                    objectMapper.writeValueAsString(request.getFormationsDispensees())
                );
            }
            if (request.getConnaissancesLinguistiques() != null) {
                user.setConnaissancesLinguistiquesJson(
                    objectMapper.writeValueAsString(request.getConnaissancesLinguistiques())
                );
            }
        } catch (JsonProcessingException e) {
            log.error("Erreur lors de la conversion des données JSON : {}", e.getMessage());
            throw new RuntimeException("Erreur lors de la conversion des données", e);
        }
        
        user = userRepository.save(user);
        log.info("Nouvel Expert enregistré : {}", user.getFullName());
        
        // L'envoi d'email est désormais géré dans le contrôleur uniquement
        
        return user;
    }
    
    public User authenticate(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return null;
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }
        
        if (!"APPROVED".equals(user.getStatus())) {
            throw new RuntimeException("Votre compte n'est pas encore approuvé");
        }
        
        return user;
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElse(null);
    }
    
}