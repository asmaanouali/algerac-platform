package com.algerac.service;

import com.algerac.dto.OECApplicationDTO;
import com.algerac.dto.OECSignupRequest;
import com.algerac.model.OECApplication;
import com.algerac.model.OECApplication.ApplicationStatus;
import com.algerac.repository.OECApplicationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * Récupérer les candidatures approuvées par le DT (en attente de l'admin)
     */
    public List<OECApplicationDTO> getApprovedApplicationsForAdmin() {
        return oecApplicationRepository.findByStatusOrderByCreatedAtDesc(ApplicationStatus.APPROVED_BY_DT)
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
     * Approuver une candidature (par le DT)
     */
    @Transactional
    public OECApplication approveApplication(Long id, Long dtUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.PENDING_DT) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        application.setStatus(ApplicationStatus.APPROVED_BY_DT);
        application.setReviewedByDtAt(LocalDateTime.now());
        application.setReviewedByDtUserId(dtUserId);
        
        application = oecApplicationRepository.save(application);
        log.info("Candidature OEC approuvée - ID: {}, Organisme: {}", 
                application.getId(), application.getNomOrganisme());
        
        // Envoyer un email à l'admin
        emailService.sendOECApplicationApprovedNotificationToAdmin(application);
        
        return application;
    }
    
    /**
     * Rejeter une candidature (par le DT)
     * La candidature est supprimée de la base de données après envoi de l'email de rejet
     */
    @Transactional
    public void rejectApplication(Long id, String rejectionReason, Long dtUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.PENDING_DT) {
            throw new RuntimeException("Cette candidature a déjà été traitée");
        }
        
        log.info("Candidature OEC rejetée - ID: {}, Organisme: {}, Motif: {}", 
                application.getId(), application.getNomOrganisme(), rejectionReason);
        
        // Envoyer un email de refus au candidat avec le motif
        emailService.sendOECApplicationRejectionToCandidate(application, rejectionReason);
        
        // Supprimer la candidature de la base de données
        oecApplicationRepository.delete(application);
        log.info("Candidature OEC supprimée de la base de données - ID: {}", id);
    }
    
    /**
     * Marquer une candidature comme traitée par l'admin (compte créé)
     */
    @Transactional
    public OECApplication markAsAccountCreated(Long id, Long adminUserId) {
        OECApplication application = getApplicationById(id);
        
        if (application.getStatus() != ApplicationStatus.APPROVED_BY_DT) {
            throw new RuntimeException("Cette candidature n'a pas été approuvée par le DT");
        }
        
        application.setStatus(ApplicationStatus.ACCOUNT_CREATED);
        application.setApprovedByAdminAt(LocalDateTime.now());
        application.setApprovedByAdminUserId(adminUserId);
        
        application = oecApplicationRepository.save(application);
        log.info("Compte OEC créé - ID candidature: {}, Organisme: {}", 
                application.getId(), application.getNomOrganisme());
        
        return application;
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
                .createdAt(application.getCreatedAt().format(DATE_FORMATTER))
                .reviewedByDtAt(application.getReviewedByDtAt() != null ? 
                        application.getReviewedByDtAt().format(DATE_FORMATTER) : null)
                .build();
    }
}
