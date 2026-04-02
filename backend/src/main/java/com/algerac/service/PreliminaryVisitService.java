package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.PreliminaryVisitRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PreliminaryVisitService {
    
    private final PreliminaryVisitRepository preliminaryVisitRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    
    /**
     * CD propose une visite préliminaire à l'OEC
     */
    @Transactional
    public PreliminaryVisit proposePreliminaryVisit(Long requestId, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls les chefs de département peuvent proposer une visite préliminaire");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.RECEIVABLE) {
            throw new RuntimeException("La demande doit être recevable avant de proposer une visite");
        }
        
        PreliminaryVisit visit = PreliminaryVisit.builder()
                .request(request)
                .proposedByCD(true)
                .proposalDate(LocalDateTime.now())
                .build();
        
        visit = preliminaryVisitRepository.save(visit);
        
        request.setStatus(RequestStatus.PRELIMINARY_VISIT_PROPOSED);
        request.setPreliminaryVisitRequired(true);
        request.setCurrentStep("Visite préliminaire proposée");
        request.setPendingWith("OEC");
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECPreliminaryVisitProposed(request);
        
        log.info("Visite préliminaire proposée pour la demande {}", request.getReferenceNumber());
        return visit;
    }
    
    /**
     * OEC accepte ou refuse la visite préliminaire
     */
    @Transactional
    public PreliminaryVisit respondToPreliminaryVisit(Long requestId, Boolean accepted, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut répondre");
        }
        
        PreliminaryVisit visit = preliminaryVisitRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Visite préliminaire non trouvée"));
        
        visit.setAcceptedByOEC(accepted);
        visit.setResponseDate(LocalDateTime.now());
        visit = preliminaryVisitRepository.save(visit);
        
        if (accepted) {
            request.setStatus(RequestStatus.PRELIMINARY_VISIT_ACCEPTED);
            request.setPreliminaryVisitAccepted(true);
            request.setCurrentStep("Visite préliminaire acceptée - planification");
            request.setPendingWith("CD/RA");
        } else {
            request.setPreliminaryVisitAccepted(false);
            request.setStatus(RequestStatus.QUOTATION_PREPARATION);
            request.setCurrentStep("Contractualisation (visite déclinée)");
            request.setPendingWith("RA/CD");
        }
        
        requestRepository.save(request);
        
        // Notifier le CD/RA
        notificationService.notifyCDPreliminaryVisitResponse(request, accepted);
        
        log.info("Réponse OEC visite préliminaire : {} pour {}", accepted ? "ACCEPTÉE" : "REFUSÉE", 
                request.getReferenceNumber());
        return visit;
    }
    
    /**
     * Programmer la visite préliminaire
     */
    @Transactional
    public PreliminaryVisit scheduleVisit(Long requestId, LocalDateTime visitDate, User currentUser) {
        PreliminaryVisit visit = preliminaryVisitRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Visite préliminaire non trouvée"));
        
        AccreditationRequest request = visit.getRequest();
        
        if (request.getStatus() != RequestStatus.PRELIMINARY_VISIT_ACCEPTED) {
            throw new RuntimeException("La visite doit être acceptée avant d'être programmée");
        }
        
        if (currentUser.getRole() != UserRole.CD && currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls CD/RA peuvent programmer la visite");
        }
        
        visit.setVisitDate(visitDate);
        visit = preliminaryVisitRepository.save(visit);
        
        request.setStatus(RequestStatus.PRELIMINARY_VISIT_SCHEDULED);
        request.setPreliminaryVisitDate(visitDate);
        request.setCurrentStep("Visite préliminaire programmée");
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECPreliminaryVisitScheduled(request, visitDate);
        
        log.info("Visite préliminaire programmée le {} pour {}", visitDate, request.getReferenceNumber());
        return visit;
    }
    
    /**
     * Soumettre le rapport de visite (FOR 12)
     */
    @Transactional
    public PreliminaryVisit submitReport(Long requestId, String reportContent, 
                                        Integer estimatedDuration, String obstaclesIdentified,
                                        Boolean hasBlockingElements, User currentUser) {
        if (currentUser.getRole() != UserRole.CD && currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls CD/RA peuvent soumettre le rapport de visite");
        }
        
        PreliminaryVisit visit = preliminaryVisitRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Visite préliminaire non trouvée"));
        
        AccreditationRequest request = visit.getRequest();
        
        visit.setReportFOR12(reportContent);
        visit.setEstimatedEvaluationDuration(estimatedDuration);
        visit.setObstaclesIdentified(obstaclesIdentified);
        visit.setHasBlockingElements(hasBlockingElements);
        visit.setReportSubmissionDate(LocalDateTime.now());
        visit = preliminaryVisitRepository.save(visit);
        
        if (hasBlockingElements) {
            request.setStatus(RequestStatus.PROCESS_SUSPENDED_OBSTACLES);
            request.setCurrentStep("Processus suspendu - obstacles à lever");
            request.setPendingWith("OEC");
            visit.setProcessSuspended(true);
        } else {
            request.setStatus(RequestStatus.QUOTATION_PREPARATION);
            request.setCurrentStep("Visite terminée - Contractualisation");
            request.setPendingWith("RA/CD");
        }
        
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECPreliminaryVisitReport(request, hasBlockingElements);
        
        log.info("Rapport de visite préliminaire soumis pour {}", request.getReferenceNumber());
        return visit;
    }
    
    /**
     * OEC lève les obstacles identifiés
     */
    @Transactional
    public PreliminaryVisit liftObstacles(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut lever les obstacles");
        }
        
        PreliminaryVisit visit = preliminaryVisitRepository.findByRequest_Id(requestId)
                .orElseThrow(() -> new RuntimeException("Visite préliminaire non trouvée"));
        
        visit.setProcessSuspended(false);
        visit.setObstaclesLiftedDate(LocalDateTime.now());
        visit = preliminaryVisitRepository.save(visit);
        
        // Continue vers contractualisation
        request.setStatus(RequestStatus.QUOTATION_PREPARATION);
        request.setCurrentStep("Contractualisation");
        request.setPendingWith("RA/CD");
        requestRepository.save(request);
        
        // Notifier CD/RA
        notificationService.notifyCDObstaclesLifted(request);
        
        log.info("Obstacles levés pour la demande {}", request.getReferenceNumber());
        return visit;
    }
}
