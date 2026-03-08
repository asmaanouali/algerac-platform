package com.algerac.service;

import com.algerac.dto.OECApplicationDTO;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.OECApplication;
import com.algerac.model.OECApplication.ApplicationStatus;
import com.algerac.model.UserRole;
import com.algerac.model.User;
import com.algerac.repository.OECApplicationRepository;
import com.algerac.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OECApplicationService {
    
    private final OECApplicationRepository oecApplicationRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    /**
     * Créer une nouvelle candidature OEC
     */
    @Transactional
    public OECApplication createApplication(OECSignupRequest request) {
        // Vérifier si une candidature existe déjà pour cet email
        if (oecApplicationRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Une candidature avec cet email existe déjà");
        }
        
        try {
            // Convertir les données du formulaire en JSON
            String formDataJson = objectMapper.writeValueAsString(request);
            
            OECApplication application = OECApplication.builder()
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
                    .formDataJson(formDataJson)
                    .build();
            
            application = oecApplicationRepository.save(application);
            log.info("Nouvelle candidature OEC créée - ID: {}, Organisme: {}", 
                    application.getId(), application.getNomOrganisme());
            
            // Envoyer un email au DT
            emailService.sendOECApplicationNotificationToDT(application);
            
            // Envoyer un email de confirmation au candidat
            emailService.sendOECApplicationConfirmationToCandidate(application);
            
            return application;
        } catch (Exception e) {
            log.error("Erreur lors de la création de la candidature OEC", e);
            throw new RuntimeException("Erreur lors de la création de la candidature", e);
        }
    }
    
    /**
     * Récupérer toutes les candidatures pour le DT
     */
    public List<OECApplicationDTO> getAllApplicationsForDT() {
        return oecApplicationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les candidatures en attente pour le DT
     */
    public List<OECApplicationDTO> getPendingApplicationsForDT() {
        return oecApplicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.PENDING_DT)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les candidatures dont le paiement est vérifié (pour l'Admin - création de compte)
     */
    public List<OECApplicationDTO> getApprovedApplicationsForAdmin() {
        return oecApplicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.PAYMENT_VERIFIED)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer une candidature par ID
     */
    public OECApplication getApplicationById(Long id) {
        return oecApplicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature non trouvée"));
    }
    
    /**
     * Approuver une candidature (par le DT) → envoi au DAG pour fixation des frais
     */
    @Transactional
    public OECApplication approveApplication(Long id, Long dtUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.PENDING_DT) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        application.setStatus(ApplicationStatus.AWAITING_DAG_FEE);
        application.setReviewedByDtAt(LocalDateTime.now());
        application.setReviewedByDtUserId(dtUserId);
        
        application = oecApplicationRepository.save(application);
        log.info("Candidature OEC approuvée par DT - ID: {}, Organisme: {} → envoyée au DAG", 
                application.getId(), application.getNomOrganisme());
        
        // Notifier tous les DAG pour fixer les frais de dépôt
        List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
        for (User dag : dagUsers) {
            notificationService.createNotification(
                dag.getId(),
                "Candidature OEC approuvée - Frais de dépôt à fixer",
                String.format("La candidature de l'organisme \"%s\" a été approuvée par la Direction Technique. " +
                        "Veuillez fixer les frais de dépôt.", application.getNomOrganisme()),
                "ACTION_REQUIRED"
            );
        }
        
        return application;
    }
    
    /**
     * Rejeter une candidature (par le DT) avec motif et manquements
     * Email envoyé à l'OEC avec motif + manquements pour qu'il corrige et refasse une demande
     */
    @Transactional
    public void rejectApplication(Long id, String rejectionReason, String manquements, Long dtUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.PENDING_DT) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        log.info("Candidature OEC rejetée - ID: {}, Organisme: {}, Motif: {}", 
                application.getId(), application.getNomOrganisme(), rejectionReason);
        
        // Envoyer un email de refus au candidat avec le motif et les manquements
        emailService.sendOECApplicationRejectionWithDeficiencies(application, rejectionReason, manquements);
        
        // Marquer aussi le User comme REJECTED pour permettre une nouvelle inscription
        userRepository.findByEmail(application.getEmail()).ifPresent(user -> {
            user.setStatus(com.algerac.model.UserStatus.REJECTED);
            userRepository.save(user);
            log.info("Compte utilisateur marqué REJECTED pour l'OEC - email: {}", application.getEmail());
        });
        
        // Supprimer la candidature pour permettre une nouvelle soumission
        oecApplicationRepository.delete(application);
        log.info("Candidature OEC supprimée de la base de données - ID: {}", id);
    }
    
    /**
     * Marquer une candidature comme traitée par l'admin (compte créé)
     */
    @Transactional
    public OECApplication markAsAccountCreated(Long id, Long adminUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.PAYMENT_VERIFIED) {
            throw new RuntimeException("Le paiement n'a pas encore été vérifié par le DAG");
        }
        
        application.setStatus(ApplicationStatus.ACCOUNT_CREATED);
        application.setApprovedByAdminAt(LocalDateTime.now());
        application.setApprovedByAdminUserId(adminUserId);
        
        OECApplication saved = oecApplicationRepository.save(application);
        
        // Activer aussi le compte User correspondant
        userRepository.findByEmail(saved.getEmail()).ifPresent(user -> {
            user.setStatus(com.algerac.model.UserStatus.APPROVED);
            userRepository.save(user);
            log.info("Compte utilisateur activé pour l'OEC - email: {}", saved.getEmail());
        });
        
        // Envoyer un email à l'OEC avec ses coordonnées de connexion
        emailService.sendOECAccountCreatedEmail(saved);
        
        log.info("Compte OEC créé - ID candidature: {}, Organisme: {}", 
                saved.getId(), saved.getNomOrganisme());
        
        return saved;
    }
    
    // ===================================================================
    // DAG WORKFLOW - Fixation des frais et vérification du paiement
    // ===================================================================
    
    /**
     * Récupérer les candidatures en attente de fixation des frais (pour le DAG)
     */
    public List<OECApplicationDTO> getApplicationsAwaitingFee() {
        return oecApplicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.AWAITING_DAG_FEE)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les candidatures en attente de vérification de paiement (pour le DAG)
     */
    public List<OECApplicationDTO> getApplicationsAwaitingPaymentVerification() {
        return oecApplicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.FEE_SET_AWAITING_PAYMENT)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer toutes les candidatures gérées par le DAG (tous statuts DAG)
     */
    public List<OECApplicationDTO> getAllApplicationsForDAG() {
        List<ApplicationStatus> dagStatuses = List.of(
                ApplicationStatus.AWAITING_DAG_FEE,
                ApplicationStatus.FEE_SET_AWAITING_PAYMENT,
                ApplicationStatus.PAYMENT_VERIFIED,
                ApplicationStatus.PAYMENT_EXPIRED,
                ApplicationStatus.ACCOUNT_CREATED
        );
        return oecApplicationRepository.findByStatusInOrderByCreatedAtDesc(dagStatuses)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * DAG fixe les frais de dépôt pour une candidature OEC approuvée par le DT.
     * Un email est envoyé à l'OEC avec le montant et l'email du DAG pour envoyer la preuve.
     * Délai de paiement : 1 mois.
     */
    @Transactional
    public OECApplication setDepositFee(Long id, BigDecimal amount, Long dagUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.AWAITING_DAG_FEE) {
            throw new RuntimeException("Cette candidature n'est pas en attente de fixation des frais");
        }
        
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Le montant doit être positif");
        }
        
        application.setDepositFeeAmount(amount);
        application.setFeeSetAt(LocalDateTime.now());
        application.setFeeSetByUserId(dagUserId);
        application.setPaymentDeadline(LocalDateTime.now().plusMonths(1));
        application.setStatus(ApplicationStatus.FEE_SET_AWAITING_PAYMENT);
        
        application = oecApplicationRepository.save(application);
        log.info("Frais de dépôt fixés à {} DA pour la candidature OEC #{} par DAG {}", 
                amount, id, dagUserId);
        
        // Envoyer un email à l'OEC avec le montant et l'email du DAG
        emailService.sendOECDepositFeeNotification(application);
        
        return application;
    }
    
    /**
     * DAG vérifie le paiement (l'OEC a envoyé la preuve par email).
     * Une fois vérifié, l'admin est notifié pour créer le compte.
     */
    @Transactional
    public OECApplication verifyPayment(Long id, Long dagUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.FEE_SET_AWAITING_PAYMENT) {
            throw new RuntimeException("Cette candidature n'est pas en attente de vérification du paiement");
        }
        
        application.setPaymentVerifiedAt(LocalDateTime.now());
        application.setPaymentVerifiedByUserId(dagUserId);
        application.setStatus(ApplicationStatus.PAYMENT_VERIFIED);
        
        application = oecApplicationRepository.save(application);
        log.info("Paiement vérifié pour la candidature OEC #{} par DAG {}", id, dagUserId);
        
        // Notifier l'admin pour créer le compte OEC
        List<User> adminUsers = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : adminUsers) {
            notificationService.createNotification(
                admin.getId(),
                "Paiement OEC vérifié - Création de compte requise",
                String.format("Le paiement de l'organisme \"%s\" a été vérifié par le DAG. " +
                        "Veuillez créer un compte pour cet OEC.", application.getNomOrganisme()),
                "ACTION_REQUIRED"
            );
        }
        
        // Envoyer aussi un email à l'admin
        emailService.sendOECApplicationApprovedNotificationToAdmin(application);
        
        return application;
    }
    
    /**
     * Rejeter une candidature pour non-paiement (délai dépassé).
     * Appelé manuellement par le DAG ou par un scheduler.
     */
    @Transactional
    public void rejectForNonPayment(Long id, Long dagUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.FEE_SET_AWAITING_PAYMENT) {
            throw new RuntimeException("Cette candidature n'est pas en attente de paiement");
        }
        
        log.info("Candidature OEC #{} rejetée pour non-paiement par DAG {}", id, dagUserId);
        
        // Envoyer un email de rejet pour non-paiement
        emailService.sendOECPaymentExpiredRejection(application);
        
        // Supprimer la candidature
        oecApplicationRepository.delete(application);
        log.info("Candidature OEC supprimée pour non-paiement - ID: {}", id);
    }
    
    /**
     * Convertir une entité en DTO
     */
    private OECApplicationDTO toDTO(OECApplication application) {
        return OECApplicationDTO.builder()
                .id(application.getId())
                .nomOrganisme(application.getNomOrganisme())
                .typeOrganisme(application.getTypeOrganisme())
                .adresseSiege(application.getAdresseSiege())
                .telephone(application.getTelephone())
                .email(application.getEmail())
                .nomRepresentant(application.getNomRepresentant())
                .fonction(application.getFonction())
                .porteeAccreditation(application.getPorteeAccreditation())
                .status(application.getStatus().name())
                .rejectionReason(application.getRejectionReason())
                .manquements(application.getManquements())
                .createdAt(application.getCreatedAt().format(DATE_FORMATTER))
                .reviewedByDtAt(application.getReviewedByDtAt() != null ? 
                        application.getReviewedByDtAt().format(DATE_FORMATTER) : null)
                .depositFeeAmount(application.getDepositFeeAmount())
                .feeSetAt(application.getFeeSetAt() != null ? 
                        application.getFeeSetAt().format(DATE_FORMATTER) : null)
                .paymentDeadline(application.getPaymentDeadline() != null ? 
                        application.getPaymentDeadline().format(DATE_FORMATTER) : null)
                .paymentVerifiedAt(application.getPaymentVerifiedAt() != null ? 
                        application.getPaymentVerifiedAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
