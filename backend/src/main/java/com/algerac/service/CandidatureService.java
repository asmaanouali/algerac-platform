package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.RequestRepository;
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
    private NotificationService notificationService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private RequestRepository requestRepository;

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

        user.setStatus(UserStatus.CANDIDATURE_APPROVED);
        user.setDateApprobation(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // Comportement différent selon le rôle
        if (user.getRole() == UserRole.OEC) {
            log.info("Candidature OEC approuvée - notification admin pour création de compte");
            emailService.sendOECApprovedNotificationToAdmin(user);
        } else {
            log.info("Candidature {} approuvée - notification admin pour création de compte", user.getUserType());
            emailService.sendOECApprovedNotificationToAdmin(user);
        }
        
        return savedUser;
    }

    /**
     * Rejette une candidature avec un motif
     * Pour les OEC : supprime l'enregistrement
     * Pour les experts : garde la candidature avec statut REJECTED
     */
    @Transactional
    public void rejectCandidature(Long userId, String rejectionReason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }

        if (user.getRole() == UserRole.OEC) {
            emailService.sendOECRejectionByDT(user, rejectionReason);
            userRepository.delete(user);
            log.info("Candidature OEC {} rejetée et supprimée de la base de données", userId);
        } else {
            // Expert/Evaluateur/Formateur - send implicit/optimistic rejection
            emailService.sendExpertDossierNotRetained(user);
            user.setStatus(UserStatus.REJECTED);
            user.setRejectionReason(rejectionReason);
            user.setRejectionType("dossier");
            userRepository.save(user);
            log.info("Candidature expert {} rejetée (dossier non retenu)", userId);
        }
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
                UserStatus.CANDIDATURE_APPROVED
        );
    }
    
    /**
     * Crée un compte pour un OEC approuvé
     */
    @Transactional
    public String createOECAccount(Long userId, Long adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getRole() != UserRole.OEC) {
            throw new RuntimeException("Cet utilisateur n'est pas un OEC");
        }
        
        if (user.getStatus() != UserStatus.CANDIDATURE_APPROVED) {
            throw new RuntimeException("Cette candidature n'a pas été approuvée par le DT");
        }

        String generatedPassword = generateSecurePassword(12);
        user.setPassword(passwordEncoder.encode(generatedPassword));
        user.setStatus(UserStatus.APPROVED);
        
        userRepository.save(user);
        
        // Auto-créer une demande d'accréditation à partir des données d'inscription
        try {
            RequestType requestType = mapTypeDemande(user.getTypeDemande());
            String domain = user.getPorteeAccreditation() != null ? user.getPorteeAccreditation() : "Non spécifié";
            
            AccreditationRequest accreditationRequest = AccreditationRequest.builder()
                    .oec(user)
                    .type(requestType)
                    .domain(domain)
                    .description("Demande d'accréditation issue de l'inscription de l'organisme " + user.getOrganizationName())
                    .status(RequestStatus.SUBMITTED)
                    .progress(10)
                    .submissionDate(user.getCreatedAt())
                    .createdAt(LocalDateTime.now())
                    .currentPhase("Soumission")
                    .currentStep("Demande soumise")
                    .nextAction("En attente de paiement")
                    .pendingWith("OEC")
                    .build();
            
            accreditationRequest = requestRepository.save(accreditationRequest);
            log.info("Demande d'accréditation #{} créée automatiquement pour l'OEC {}", 
                    accreditationRequest.getId(), user.getOrganizationName());
        } catch (Exception e) {
            log.error("Erreur lors de la création automatique de la demande d'accréditation pour l'OEC {} : {}", 
                    userId, e.getMessage());
        }
        
        log.info("Compte OEC créé pour l'utilisateur {} par l'admin {}", userId, adminUserId);
        emailService.sendOECAccountCredentials(user, generatedPassword);
        
        return generatedPassword;
    }
    
    /**
     * Mappe le typeDemande string vers le RequestType enum
     */
    private RequestType mapTypeDemande(String typeDemande) {
        if (typeDemande == null) return RequestType.INITIAL;
        return switch (typeDemande.toLowerCase()) {
            case "extension" -> RequestType.EXTENSION;
            case "renouvellement" -> RequestType.RENOUVELLEMENT;
            case "transfert" -> RequestType.EXTENSION; // Transfert maps to extension
            default -> RequestType.INITIAL;
        };
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
    
    /**
     * Récupère toutes les candidatures d'experts/évaluateurs/formateurs (tous statuts)
     */
    public List<User> getExpertCandidatures() {
        return userRepository.findAll()
            .stream()
            .filter(user -> user.getUserType() != null && 
                   (user.getUserType().equalsIgnoreCase("EXPERT") || 
                    user.getUserType().equalsIgnoreCase("EVALUATEUR") || 
                    user.getUserType().equalsIgnoreCase("FORMATEUR")))
            .toList();
    }
    
    // ===================================================================
    // INTERVIEW WORKFLOW - Expert/Évaluateur/Formateur
    // ===================================================================
    
    /**
     * Présélectionne une candidature et planifie un entretien
     * GES_COMPETENCES choisit la date d'entretien
     */
    @Transactional
    public User scheduleInterview(Long userId, LocalDateTime interviewDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Seules les candidatures en attente peuvent être planifiées pour un entretien");
        }
        
        validateExpertType(user);

        user.setStatus(UserStatus.INTERVIEW_SCHEDULED);
        user.setInterviewDate(interviewDate);
        
        User savedUser = userRepository.save(user);
        
        // Envoyer email de convocation au candidat
        emailService.sendInterviewConvocationEmail(user, interviewDate);
        
        log.info("Entretien planifié pour {} {} le {} - candidature {}", 
                user.getPrenom(), user.getNom(), interviewDate, userId);
        
        return savedUser;
    }
    
    /**
     * Met à jour la date d'entretien (si le candidat a proposé une autre date)
     */
    @Transactional
    public User updateInterviewDate(Long userId, LocalDateTime newDate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_SCHEDULED && user.getStatus() != UserStatus.INTERVIEW_CONFIRMED) {
            throw new RuntimeException("Aucun entretien planifié pour cette candidature");
        }
        
        user.setInterviewDate(newDate);
        user.setStatus(UserStatus.INTERVIEW_SCHEDULED); // Reset to scheduled if was confirmed
        
        User savedUser = userRepository.save(user);
        log.info("Date d'entretien mise à jour pour {} {} : {}", user.getPrenom(), user.getNom(), newDate);
        
        return savedUser;
    }
    
    /**
     * Confirme l'entretien (date acceptée par les deux parties)
     */
    @Transactional
    public User confirmInterview(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("L'entretien n'est pas dans un état planifié");
        }
        
        user.setStatus(UserStatus.INTERVIEW_CONFIRMED);
        
        User savedUser = userRepository.save(user);
        log.info("Entretien confirmé pour {} {}", user.getPrenom(), user.getNom());
        
        return savedUser;
    }
    
    /**
     * Sauvegarde les notes et la checklist de l'entretien
     */
    @Transactional
    public User saveInterviewNotes(Long userId, String notes, String checklistJson) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_SCHEDULED && 
            user.getStatus() != UserStatus.INTERVIEW_CONFIRMED &&
            user.getStatus() != UserStatus.INTERVIEW_COMPLETED) {
            throw new RuntimeException("Aucun entretien en cours pour cette candidature");
        }
        
        if (notes != null) {
            user.setInterviewNotes(notes);
        }
        if (checklistJson != null) {
            user.setInterviewChecklistJson(checklistJson);
        }
        
        User savedUser = userRepository.save(user);
        log.info("Notes d'entretien sauvegardées pour {} {}", user.getPrenom(), user.getNom());
        
        return savedUser;
    }
    
    /**
     * Marque l'entretien comme terminé
     */
    @Transactional
    public User markInterviewCompleted(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_SCHEDULED && user.getStatus() != UserStatus.INTERVIEW_CONFIRMED) {
            throw new RuntimeException("L'entretien n'est pas en cours");
        }
        
        user.setStatus(UserStatus.INTERVIEW_COMPLETED);
        
        User savedUser = userRepository.save(user);
        log.info("Entretien marqué comme terminé pour {} {}", user.getPrenom(), user.getNom());
        
        return savedUser;
    }
    
    /**
     * Accepte le candidat après l'entretien
     * Notifie l'admin IN-APP uniquement (pas d'email) pour créer le compte
     */
    @Transactional
    public User acceptAfterInterview(Long userId, Long gesCompetencesUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_COMPLETED && 
            user.getStatus() != UserStatus.INTERVIEW_CONFIRMED &&
            user.getStatus() != UserStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Cette candidature n'est pas dans un état d'entretien");
        }
        
        validateExpertType(user);

        user.setStatus(UserStatus.CANDIDATURE_APPROVED);
        user.setInterviewDecision("ACCEPTED");
        user.setInterviewDecisionDate(LocalDateTime.now());
        user.setDateApprobation(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // ONLY in-app notification to admin (NO EMAIL)
        String typeLabel = getTypeLabel(user);
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "Nouvelle candidature " + typeLabel + " acceptée",
                String.format("La candidature de %s %s (%s) a été acceptée après entretien par le Gestionnaire de Compétences. Veuillez créer un compte utilisateur.",
                    user.getPrenom(), user.getNom(), typeLabel),
                "success"
            );
        }
        
        log.info("Candidature {} acceptée après entretien - notification in-app envoyée à l'admin", userId);
        
        return savedUser;
    }
    
    /**
     * Rejette le candidat après l'entretien 
     */
    @Transactional
    public void rejectAfterInterview(Long userId, String notes) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_COMPLETED && 
            user.getStatus() != UserStatus.INTERVIEW_CONFIRMED &&
            user.getStatus() != UserStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Cette candidature n'est pas dans un état d'entretien");
        }
        
        user.setStatus(UserStatus.REJECTED);
        user.setInterviewDecision("REJECTED");
        user.setInterviewDecisionDate(LocalDateTime.now());
        user.setRejectionType("interview");
        if (notes != null) {
            user.setRejectionReason(notes);
        }
        
        userRepository.save(user);
        
        // Send implicit/optimistic rejection email
        emailService.sendExpertInterviewNotRetained(user);
        
        log.info("Candidature {} rejetée après entretien (email implicite envoyé)", userId);
    }
    
    /**
     * Rejette le dossier de candidature (avant entretien) - refus implicite
     */
    @Transactional
    public void rejectDossier(Long userId, String internalReason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        validateExpertType(user);

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(internalReason);
        user.setRejectionType("dossier");
        
        userRepository.save(user);
        
        // Send implicit/optimistic rejection email (not direct)
        emailService.sendExpertDossierNotRetained(user);
        
        log.info("Dossier de candidature {} rejeté (email implicite envoyé)", userId);
    }
    
    /**
     * Récupère tous les entretiens planifiés/confirmés
     */
    public List<User> getScheduledInterviews() {
        return userRepository.findAll()
            .stream()
            .filter(user -> user.getUserType() != null && 
                   (user.getUserType().equalsIgnoreCase("EXPERT") || 
                    user.getUserType().equalsIgnoreCase("EVALUATEUR") || 
                    user.getUserType().equalsIgnoreCase("FORMATEUR")) &&
                   (user.getStatus() == UserStatus.INTERVIEW_SCHEDULED || 
                    user.getStatus() == UserStatus.INTERVIEW_CONFIRMED ||
                    user.getStatus() == UserStatus.INTERVIEW_COMPLETED))
            .toList();
    }
    
    /**
     * Récupère les candidatures d'experts/évaluateurs/formateurs approuvées en attente de création de compte
     */
    public List<User> getApprovedExpertCandidatures() {
        return userRepository.findAll()
            .stream()
            .filter(user -> user.getUserType() != null && 
                   (user.getUserType().equalsIgnoreCase("EXPERT") || 
                    user.getUserType().equalsIgnoreCase("EVALUATEUR") || 
                    user.getUserType().equalsIgnoreCase("FORMATEUR")) &&
                   user.getStatus() == UserStatus.CANDIDATURE_APPROVED)
            .toList();
    }
    
    /**
     * Crée un compte pour un expert/évaluateur/formateur approuvé par GES_COMPETENCES
     */
    @Transactional
    public String createExpertAccount(Long userId, Long adminUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        validateExpertType(user);
        
        if (user.getStatus() != UserStatus.CANDIDATURE_APPROVED) {
            throw new RuntimeException("Cette candidature n'a pas été approuvée par GES_COMPETENCES");
        }

        String generatedPassword = generateSecurePassword(12);
        user.setPassword(passwordEncoder.encode(generatedPassword));
        user.setStatus(UserStatus.APPROVED);
        
        userRepository.save(user);
        
        log.info("Compte {} créé pour l'utilisateur {} par l'admin {}", user.getUserType(), userId, adminUserId);
        
        // Send congratulations email with account credentials
        emailService.sendExpertAccountAccepted(user, generatedPassword);
        
        return generatedPassword;
    }
    
    // ===================================================================
    // BLACKLIST METHODS
    // ===================================================================
    
    /**
     * Blackliste un candidat (spam ou abus)
     */
    @Transactional
    public void blacklistCandidate(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setBlacklisted(true);
        user.setBlacklistReason(reason);
        user.setBlacklistedAt(LocalDateTime.now());
        
        userRepository.save(user);
        log.info("Candidat {} blacklisté. Raison: {}", userId, reason);
    }
    
    /**
     * Retire un candidat de la blacklist
     */
    @Transactional
    public void unblacklistCandidate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setBlacklisted(false);
        user.setBlacklistReason(null);
        user.setBlacklistedAt(null);
        
        userRepository.save(user);
        log.info("Candidat {} retiré de la blacklist", userId);
    }
    
    // ===================================================================
    // HELPER METHODS
    // ===================================================================
    
    private void validateExpertType(User user) {
        if (user.getUserType() == null || 
            (!user.getUserType().equalsIgnoreCase("EXPERT") && 
             !user.getUserType().equalsIgnoreCase("EVALUATEUR") && 
             !user.getUserType().equalsIgnoreCase("FORMATEUR"))) {
            throw new RuntimeException("Cette candidature n'est pas une candidature expert/évaluateur/formateur");
        }
    }
    
    private String getTypeLabel(User user) {
        if (user.getUserType() == null) return "Expert";
        return switch (user.getUserType().toUpperCase()) {
            case "FORMATEUR" -> "Formateur";
            case "EVALUATEUR" -> "Évaluateur";
            default -> "Expert";
        };
    }
}
