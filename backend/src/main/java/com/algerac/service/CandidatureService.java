package com.algerac.service;

import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import com.algerac.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class CandidatureService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Récupère toutes les candidatures en attente (PENDING)
     */
    public List<User> getPendingCandidatures() {
        return userRepository.findByStatusOrderByCreatedAtDesc(UserStatus.PENDING);
    }

    /**
     * Approuve une candidature - change le status à APPROVED et envoie un email
     * Pour les OEC : envoie un email à l'admin pour qu'il crée le compte
     * Pour les autres : envoie un email de confirmation au candidat
     */
    @Transactional
    public User approveCandidature(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }

        user.setStatus(UserStatus.APPROVED);
        user.setDateApprobation(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // Comportement différent selon le rôle
        if (user.getRole() == UserRole.OEC) {
            // Pour les OEC : notifier l'admin pour créer le compte
            log.info("Candidature OEC approuvée - notification admin pour création de compte");
            emailService.sendOECApprovedNotificationToAdmin(user);
        } else {
            // Pour les experts : envoyer email de confirmation directement
            log.info("Candidature Expert approuvée - envoi email de confirmation");
            emailService.sendCandidatureApprovedEmail(user);
        }
        
        return savedUser;
    }

    /**
     * Rejette une candidature avec un motif
     */
    @Transactional
    public User rejectCandidature(Long userId, String rejectionReason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(rejectionReason);
        
        User savedUser = userRepository.save(user);
        
        // Envoyer email de rejet avec motif
        emailService.sendCandidatureRejectedEmail(user, rejectionReason);
        
        return savedUser;
    }

    /**
     * Récupère une candidature par ID
     */
    public User getCandidatureById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));
    }

    /**
     * Récupère toutes les candidatures (tous statuts)
     */
    public List<User> getAllCandidatures() {
        return userRepository.findAll();
    }
    
    /**
     * Récupère toutes les candidatures OEC en attente (PENDING)
     */
    public List<User> getPendingOECCandidatures() {
        return userRepository.findByRoleAndStatusOrderByCreatedAtDesc(
                com.algerac.model.UserRole.OEC, 
                UserStatus.PENDING
        );
    }
    
    /**
     * Récupère toutes les candidatures OEC (tous statuts)
     */
    public List<User> getAllOECCandidatures() {
        return userRepository.findByRoleOrderByCreatedAtDesc(com.algerac.model.UserRole.OEC);
    }
    
    /**
     * Récupère les candidatures OEC approuvées en attente de création de compte
     */
    public List<User> getApprovedOECCandidatures() {
        return userRepository.findByRoleAndStatusOrderByCreatedAtDesc(
                UserRole.OEC, 
                UserStatus.APPROVED
        );
    }
    
    /**
     * Crée un compte pour un OEC approuvé
     * Génère un mot de passe aléatoire et envoie les credentials par email
     */
    @Transactional
    public String createOECAccount(Long userId, Long adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getRole() != UserRole.OEC) {
            throw new RuntimeException("Cet utilisateur n'est pas un OEC");
        }
        
        if (user.getStatus() != UserStatus.APPROVED) {
            throw new RuntimeException("Cette candidature n'a pas été approuvée par le DT");
        }

        // Générer un mot de passe aléatoire sécurisé (12 caractères)
        String generatedPassword = generateSecurePassword(12);
        
        // Hasher et sauvegarder le mot de passe
        user.setPassword(passwordEncoder.encode(generatedPassword));
        
        // Le compte est maintenant actif - on ne change pas le status APPROVED
        // car il indique que le compte est actif
        
        User savedUser = userRepository.save(user);
        
        log.info("Compte OEC créé pour l'utilisateur {} par l'admin {}", userId, adminUserId);
        
        // Envoyer email avec les credentials à l'OEC
        emailService.sendOECAccountCredentials(user, generatedPassword);
        
        return generatedPassword; // Retourner pour affichage à l'admin si nécessaire
    }
    
    /**
     * Génère un mot de passe aléatoire sécurisé
     */
    private String generateSecurePassword(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder();
        
        for (int i = 0; i < length; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return password.toString();
    }
}
