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
import java.util.Map;
import java.util.UUID;

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
            log.info("Candidature OEC approuvée - notification DAG pour fixation des frais de dépôt");
            // Notify all DAG users via in-app notification
            List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
            for (User dag : dagUsers) {
                notificationService.createNotification(
                    dag.getId(),
                    "Candidature OEC approuvée - Frais de dépôt à fixer",
                    String.format("La candidature de %s a été approuvée par la Direction Technique. " +
                            "Veuillez fixer les frais de dépôt et communiquer les modalités de paiement.",
                            user.getOrganizationName() != null ? user.getOrganizationName() : user.getFullName()),
                    "info"
                );
            }
            // Also send email to admin as backup
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
     * GES_COMPETENCES choisit la date d'entretien et les membres du panel
     */
    @Transactional
    public User scheduleInterview(Long userId, LocalDateTime interviewDate, Long cdId, Long raId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.PENDING && user.getStatus() != UserStatus.DOCUMENTS_SUBMITTED) {
            throw new RuntimeException("Seules les candidatures en attente ou avec documents soumis peuvent être planifiées pour un entretien");
        }
        
        validateExpertType(user);

        // Validate panel members
        if (cdId != null) {
            User cd = userRepository.findById(cdId)
                    .orElseThrow(() -> new RuntimeException("Chef de département non trouvé"));
            if (!cd.hasRole(UserRole.CD)) {
                throw new RuntimeException("L'utilisateur sélectionné n'est pas un Chef de Département");
            }
            user.setInterviewPanelCdId(cdId);
        }
        if (raId != null) {
            User ra = userRepository.findById(raId)
                    .orElseThrow(() -> new RuntimeException("Responsable d'accréditation non trouvé"));
            if (!ra.hasRole(UserRole.RA)) {
                throw new RuntimeException("L'utilisateur sélectionné n'est pas un Responsable d'Accréditation");
            }
            user.setInterviewPanelRaId(raId);
        }

        user.setStatus(UserStatus.INTERVIEW_SCHEDULED);
        user.setInterviewDate(interviewDate);
        user.setInterviewScheduledAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(user);
        
        // Envoyer email de convocation au candidat
        emailService.sendInterviewConvocationEmail(user, interviewDate);
        
        // Notify all panel members (DT, RQ, selected CD, selected RA)
        notifyInterviewPanel(savedUser, interviewDate);
        
        log.info("Entretien planifié pour {} {} le {} - candidature {} (panel: CD={}, RA={})", 
                user.getPrenom(), user.getNom(), interviewDate, userId, cdId, raId);
        
        return savedUser;
    }
    
    /**
     * Notifie tous les membres du panel d'entretien
     * Panel: DT, RQ, CD sélectionné, RA sélectionné, GES_COMPETENCES
     */
    private void notifyInterviewPanel(User candidate, LocalDateTime interviewDate) {
        String typeLabel = getTypeLabel(candidate);
        String formattedDate = interviewDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));
        String candidateName = candidate.getPrenom() + " " + candidate.getNom();
        
        String title = "Entretien planifié - " + candidateName;
        String message = String.format(
            "Un entretien est planifié le %s pour le candidat %s (%s - %s). " +
            "Votre présence est requise. Domaine : %s",
            formattedDate, candidateName, typeLabel, 
            candidate.getRegistrationId(),
            candidate.getDomaineExpertise() != null ? candidate.getDomaineExpertise() : "Non spécifié"
        );
        
        // Notify all DT users
        List<User> dtUsers = userRepository.findByRole(UserRole.DT);
        for (User dt : dtUsers) {
            notificationService.createNotification(dt.getId(), title, message, "info");
        }
        
        // Notify all RQ users
        List<User> rqUsers = userRepository.findByRole(UserRole.RQ);
        for (User rq : rqUsers) {
            notificationService.createNotification(rq.getId(), title, message, "info");
        }
        
        // Notify selected CD
        if (candidate.getInterviewPanelCdId() != null) {
            notificationService.createNotification(candidate.getInterviewPanelCdId(), title, message, "info");
        }
        
        // Notify selected RA
        if (candidate.getInterviewPanelRaId() != null) {
            notificationService.createNotification(candidate.getInterviewPanelRaId(), title, message, "info");
        }
        
        // Send email to panel members
        emailService.sendInterviewPanelNotification(candidate, interviewDate, dtUsers, rqUsers, 
            candidate.getInterviewPanelCdId() != null ? userRepository.findById(candidate.getInterviewPanelCdId()).orElse(null) : null,
            candidate.getInterviewPanelRaId() != null ? userRepository.findById(candidate.getInterviewPanelRaId()).orElse(null) : null
        );
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
        user.setInterviewScheduledAt(LocalDateTime.now()); // Reset deadline
        
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
    public User acceptAfterInterview(Long userId, Long gesCompetencesUserId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getStatus() != UserStatus.INTERVIEW_COMPLETED && 
            user.getStatus() != UserStatus.INTERVIEW_CONFIRMED &&
            user.getStatus() != UserStatus.INTERVIEW_SCHEDULED) {
            throw new RuntimeException("Cette candidature n'est pas dans un état d'entretien");
        }
        
        validateExpertType(user);

        // Set the role chosen by GES_COMPETENCES
        if (role != null && !role.isBlank()) {
            user.setRole(UserRole.valueOf(role));
        }

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

        if (user.getStatus() != UserStatus.PENDING && 
            user.getStatus() != UserStatus.PROFILE_PRESELECTED && 
            user.getStatus() != UserStatus.DOCUMENTS_SUBMITTED) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        validateExpertType(user);

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(internalReason);
        user.setRejectionType("dossier");
        user.setFor28Token(null);
        user.setFor28TokenExpiresAt(null);
        
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
    // FOR28 WORKFLOW METHODS
    // ===================================================================
    
    /**
     * Présélectionne un profil après analyse du FOR20.
     * Génère un token sécurisé et envoie un email avec le lien FOR28.
     */
    @Transactional
    public User preselectProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        if (user.getStatus() != UserStatus.PENDING) {
            throw new RuntimeException("Seules les candidatures en attente peuvent être présélectionnées");
        }
        
        validateExpertType(user);
        
        String token = UUID.randomUUID().toString();
        user.setFor28Token(token);
        user.setFor28TokenExpiresAt(LocalDateTime.now().plusDays(30));
        user.setStatus(UserStatus.PROFILE_PRESELECTED);
        
        User savedUser = userRepository.save(user);
        
        emailService.sendFor28AccessEmail(user, token);
        
        log.info("Profil présélectionné pour {} {} - token FOR28 généré, email envoyé", 
                user.getPrenom(), user.getNom());
        
        return savedUser;
    }
    
    /**
     * Valide un token FOR28 et retourne les informations du candidat.
     * Vérifie que le token existe, n'est pas expiré, et que l'email correspond.
     */
    public User validateFor28Token(String token, String email) {
        User user = userRepository.findByFor28Token(token)
            .orElseThrow(() -> new RuntimeException("Lien invalide ou expiré"));
        
        if (user.getFor28TokenExpiresAt() == null || user.getFor28TokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Ce lien a expiré. Veuillez contacter l'organisme.");
        }
        
        if (user.getStatus() != UserStatus.PROFILE_PRESELECTED) {
            throw new RuntimeException("Les documents ont déjà été soumis ou le dossier a été traité.");
        }
        
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new RuntimeException("L'adresse email ne correspond pas au candidat concerné.");
        }
        
        return user;
    }
    
    /**
     * Soumet les documents FOR28.
     * Vérifie le token, l'email, sauvegarde les documents et met à jour le statut.
     */
    @Transactional
    public User submitFor28Documents(String token, String email, String documentsJson) {
        User user = validateFor28Token(token, email);
        
        user.setDocumentsJson(documentsJson);
        user.setFor28SubmittedAt(LocalDateTime.now());
        user.setStatus(UserStatus.DOCUMENTS_SUBMITTED);
        user.setFor28Token(null);
        user.setFor28TokenExpiresAt(null);
        
        User savedUser = userRepository.save(user);
        
        // Notifier GES_COMPETENCES que les documents ont été soumis
        List<User> gesUsers = userRepository.findByRole(UserRole.GES_COMPETENCES);
        String typeLabel = getTypeLabel(user);
        for (User ges : gesUsers) {
            notificationService.createNotification(
                ges.getId(),
                "Documents FOR28 reçus - " + typeLabel,
                String.format("Le candidat %s %s (%s) a soumis ses documents FOR28. Le dossier est prêt pour la planification d'un entretien.",
                    user.getPrenom(), user.getNom(), user.getRegistrationId()),
                "info"
            );
        }
        
        log.info("Documents FOR28 soumis par {} {} - statut mis à jour vers DOCUMENTS_SUBMITTED", 
                user.getPrenom(), user.getNom());
        
        return savedUser;
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
    
    /**
     * Restaure une candidature rejetée (remet en PENDING)
     */
    @Transactional
    public void restoreCandidature(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        if (user.getStatus() != UserStatus.REJECTED) {
            throw new RuntimeException("Seules les candidatures rejetées peuvent être restaurées");
        }
        
        user.setStatus(UserStatus.PENDING);
        user.setRejectionReason(null);
        user.setRejectionType(null);
        user.setInterviewDecision(null);
        user.setInterviewDecisionDate(null);
        user.setInterviewScheduledAt(null);
        
        userRepository.save(user);
        log.info("Candidature {} restaurée en PENDING", userId);
    }
    
    /**
     * Expire les entretiens non confirmés après 7 jours.
     * Déplace les candidatures INTERVIEW_SCHEDULED dont le interviewScheduledAt dépasse 7 jours vers REJECTED.
     * @return nombre de candidatures expirées
     */
    @Transactional
    public int expireUnconfirmedInterviews() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(7);
        
        List<User> expired = userRepository.findAll().stream()
            .filter(u -> u.getStatus() == UserStatus.INTERVIEW_SCHEDULED)
            .filter(u -> u.getInterviewScheduledAt() != null && u.getInterviewScheduledAt().isBefore(deadline))
            .toList();
        
        for (User user : expired) {
            user.setStatus(UserStatus.REJECTED);
            user.setRejectionType("interview_non_confirme");
            user.setRejectionReason("Entretien non confirmé dans le délai de 7 jours");
            user.setInterviewDecision("REJECTED");
            user.setInterviewDecisionDate(LocalDateTime.now());
            userRepository.save(user);
            
            log.info("Candidature {} expirée - entretien non confirmé après 7 jours (planifié le {})", 
                    user.getId(), user.getInterviewScheduledAt());
        }
        
        if (!expired.isEmpty()) {
            log.info("{} candidature(s) expirée(s) pour non-confirmation d'entretien", expired.size());
        }
        
        return expired.size();
    }
    
    /**
     * Toggle starred/favorite status
     */
    @Transactional
    public boolean toggleStar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        boolean newValue = !Boolean.TRUE.equals(user.getStarred());
        user.setStarred(newValue);
        
        userRepository.save(user);
        log.info("Candidature {} starred: {}", userId, newValue);
        return newValue;
    }
    
    // ===================================================================
    // INTERVIEW PANEL METHODS
    // ===================================================================
    
    /**
     * Récupère les entretiens où l'utilisateur est membre du panel
     */
    public List<User> getInterviewsForPanelMember(Long userId, String userRole) {
        List<User> allInterviews = getScheduledInterviews();
        // Also include completed/approved/rejected that had interviews
        List<User> allExpert = getExpertCandidatures();
        for (User u : allExpert) {
            if (u.getInterviewDate() != null && !allInterviews.contains(u)) {
                allInterviews = new java.util.ArrayList<>(allInterviews);
                allInterviews.add(u);
            }
        }
        
        return allInterviews.stream()
            .filter(candidate -> isUserInInterviewPanel(userId, userRole, candidate))
            .toList();
    }
    
    /**
     * Vérifie si un utilisateur fait partie du panel d'entretien d'un candidat
     */
    public boolean isUserInInterviewPanel(Long userId, String userRole, User candidate) {
        if (userRole == null) return false;
        String role = userRole.toUpperCase();
        
        // DT and RQ are always part of the panel for all interviews
        if (role.equals("DT") || role.equals("RQ") || role.equals("GES_COMPETENCES")) {
            return true;
        }
        
        // CD - only if specifically selected
        if (role.equals("CD") && candidate.getInterviewPanelCdId() != null 
            && candidate.getInterviewPanelCdId().equals(userId)) {
            return true;
        }
        
        // RA - only if specifically selected
        if (role.equals("RA") && candidate.getInterviewPanelRaId() != null 
            && candidate.getInterviewPanelRaId().equals(userId)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Récupère les CD disponibles pour le panel
     */
    public List<Map<String, Object>> getAvailableCDs() {
        return userRepository.findByRole(UserRole.CD).stream()
            .map(user -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", user.getId());
                map.put("fullName", user.getFullName());
                map.put("email", user.getEmail());
                return map;
            })
            .toList();
    }
    
    /**
     * Récupère les RA disponibles pour le panel
     */
    public List<Map<String, Object>> getAvailableRAs() {
        return userRepository.findByRole(UserRole.RA).stream()
            .map(user -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", user.getId());
                map.put("fullName", user.getFullName());
                map.put("email", user.getEmail());
                return map;
            })
            .toList();
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
