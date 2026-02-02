package com.algerac.service;

import com.algerac.dto.ExpertSignupRequest;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
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
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .specialite(request.getSpecialite())
                .experience(request.getExperience())
                .diplomes(request.getDiplomes())
                .langues(request.getLangues())
                .disponibilite(request.getDisponibilite())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        
        user = userRepository.save(user);
        log.info("Nouvel Expert enregistré : {}", user.getFullName());
        
        try {
            emailService.sendExpertRegistrationNotification(user);
            emailService.sendConfirmationToUser(user);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi des emails : {}", e.getMessage());
        }
        
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
    
    // ADD THIS METHOD
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElse(null);
    }
}