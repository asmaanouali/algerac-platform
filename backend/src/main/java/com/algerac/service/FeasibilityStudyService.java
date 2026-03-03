package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.FeasibilityStudyRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeasibilityStudyService {
    
    private final FeasibilityStudyRepository feasibilityStudyRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    /**
     * Démarrer une étude de faisabilité pour une demande
     */
    @Transactional
    public FeasibilityStudy startFeasibilityStudy(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cette demande ne vous est pas assignée");
        }
        
        if (request.getStatus() != RequestStatus.ASSIGNED_TO_RA) {
            throw new RuntimeException("La demande n'est pas au bon statut");
        }
        
        // Vérifier si une étude existe déjà
        if (feasibilityStudyRepository.findByRequest_Id(requestId).isPresent()) {
            throw new RuntimeException("Une étude de faisabilité existe déjà pour cette demande");
        }
        
        FeasibilityStudy study = FeasibilityStudy.builder()
                .request(request)
                .responsableAccreditation(currentUser)
                .decision(FeasibilityDecision.PENDING)
                .studyStartDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        
        study = feasibilityStudyRepository.save(study);
        
        // Mettre à jour le statut de la demande
        request.setStatus(RequestStatus.RECEIVABILITY_STUDY);
        request.setProgress(40);
        requestRepository.save(request);
        
        log.info("Étude de faisabilité démarrée pour la demande {} par {}", 
                request.getReferenceNumber(), currentUser.getFullName());
        
        return study;
    }
    
    /**
     * Soumettre la décision de faisabilité
     */
    @Transactional
    public FeasibilityStudy submitFeasibilityDecision(
            Long requestId, 
            FeasibilityDecision decision,
            String comments,
            String technicalAnalysis,
            String complianceCheck,
            String rejectionReason,
            User currentUser
    ) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à prendre cette décision");
        }
        
        FeasibilityStudy study = feasibilityStudyRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Étude de faisabilité non trouvée"));
        
        study.setDecision(decision);
        study.setComments(comments);
        study.setTechnicalAnalysis(technicalAnalysis);
        study.setComplianceCheck(complianceCheck);
        study.setRejectionReason(rejectionReason);
        study.setStudyCompletionDate(LocalDateTime.now());
        
        study = feasibilityStudyRepository.save(study);
        
        // Mettre à jour le statut de la demande
        if (decision == FeasibilityDecision.RECEIVABLE) {
            request.setStatus(RequestStatus.RECEIVABLE);
            request.setProgress(50);
            
            // Notifier l'OEC de la décision positive
            notificationService.notifyOECReceivabilityPositive(request);
        } else if (decision == FeasibilityDecision.NOT_RECEIVABLE) {
            request.setStatus(RequestStatus.NOT_RECEIVABLE);
            request.setProgress(100);
            
            // Notifier l'OEC de la décision négative et envoyer un email
            notificationService.notifyOECReceivabilityNegative(request, rejectionReason);
            emailService.sendRejectionEmail(request, rejectionReason);
        }
        
        requestRepository.save(request);
        
        log.info("Décision de faisabilité soumise pour la demande {} : {}", 
                request.getReferenceNumber(), decision);
        
        return study;
    }
    
    /**
     * Obtenir l'étude de faisabilité pour une demande
     */
    public FeasibilityStudy getFeasibilityStudyByRequest(Long requestId) {
        return feasibilityStudyRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Étude de faisabilité non trouvée"));
    }
    
    /**
     * Obtenir toutes les études assignées à un RA
     */
    public List<FeasibilityStudy> getStudiesByRA(Long raId) {
         return feasibilityStudyRepository.findByResponsableAccreditationId(raId);
    }
    
    /**
     * Obtenir toutes les études avec une décision spécifique
     */
    public List<FeasibilityStudy> getStudiesByDecision(FeasibilityDecision decision) {
        return feasibilityStudyRepository.findByDecision(decision);
    }
}
