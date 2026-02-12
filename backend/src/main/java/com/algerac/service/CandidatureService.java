package com.algerac.service;

import com.algerac.model.User;
import com.algerac.model.UserStatus;
import com.algerac.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CandidatureService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;

    /**
     * Récupère toutes les candidatures en attente (PENDING)
     */
    public List<User> getPendingCandidatures() {
        return userRepository.findByStatusOrderByCreatedAtDesc(UserStatus.PENDING);
    }

    /**
     * Approuve une candidature - change le status à APPROVED et envoie un email
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
        
        // Envoyer email de confirmation d'approbation
        emailService.sendCandidatureApprovedEmail(user);
        
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
}
