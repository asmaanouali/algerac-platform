package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CASDecisionService {
    
    private final CASDecisionRepository casDecisionRepository;
    private final RequestRepository requestRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final SurveillancePlanRepository surveillancePlanRepository;
    private final NotificationService notificationService;
    
    /**
     * Convoquer le CAS et planifier la réunion
     */
    @Transactional
    public void scheduleCASMeeting(Long requestId, LocalDateTime meetingDate, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut convoquer le CAS");
        }
        
        request.setStatus(RequestStatus.CAS_SCHEDULED);
        request.setCurrentStep("Réunion CAS programmée");
        requestRepository.save(request);
        
        // Notifier les membres du CAS
        notificationService.notifyCASMembersScheduled(request, meetingDate);
        
        log.info("Réunion CAS programmée le {} pour {}", meetingDate, request.getReferenceNumber());
    }
    
    /**
     * Enregistrer la décision du CAS
     */
    @Transactional
    public CASDecision recordDecision(Long requestId, String decisionNumber, 
                                     CASDecisionType decisionType, String justification,
                                     String scope, String conditions, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        CASDecision decision = CASDecision.builder()
                .request(request)
                .decisionNumber(decisionNumber)
                .decisionType(decisionType)
                .meetingDate(LocalDateTime.now())
                .justification(justification)
                .scope(scope)
                .conditions(conditions)
                .build();
        
        decision = casDecisionRepository.save(decision);
        request.setCasDecisionDate(LocalDateTime.now());
        
        // Mettre à jour le statut de la demande selon la décision
        switch (decisionType) {
            case GRANT_FULL:
            case GRANT_REDUCED:
            case GRANT_WITH_RESERVES:
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
                request.setCurrentStep("Accréditation accordée - préparation certificat");
                request.setPendingWith("CD/RA");
                
                // Notifier l'OEC de la bonne nouvelle
                notificationService.notifyOECAccreditationGranted(request, decisionType, scope);
                break;
                
            case REFUSAL:
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
                request.setCurrentStep("Accréditation refusée");
                request.setPendingWith("NONE");
                decision.setAppealRightNotified(true);
                
                // Notifier l'OEC du refus
                notificationService.notifyOECAccreditationRefused(request, justification);
                break;
                
            case POSTPONEMENT:
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
                request.setCurrentStep("Décision ajournée - compléments requis");
                request.setPendingWith("OEC");
                
                // Notifier l'OEC des compléments requis
                notificationService.notifyOECAccreditationPostponed(request, justification);
                break;
                
            case REPORT_DECISION:
                request.setCurrentStep("Décision reportée - informations complémentaires");
                request.setPendingWith("CD/RA");
                break;
                
            case MAINTAIN:
                request.setStatus(RequestStatus.ACTIVE);
                request.setCurrentStep("Accréditation maintenue");
                
                // Notifier l'OEC
                notificationService.notifyOECAccreditationMaintained(request);
                break;
                
            case SUSPENSION:
                request.setStatus(RequestStatus.SUSPENDED);
                request.setCurrentStep("Accréditation suspendue");
                
                // Notifier l'OEC de la suspension
                notificationService.notifyOECAccreditationSuspended(request, justification);
                break;
                
            case WITHDRAWAL:
                request.setStatus(RequestStatus.WITHDRAWN);
                request.setCurrentStep("Accréditation retirée");
                
                // Notifier l'OEC du retrait
                notificationService.notifyOECAccreditationWithdrawn(request, justification);
                break;
                
            case SCOPE_REDUCTION:
                request.setStatus(RequestStatus.ACTIVE);
                request.setCurrentStep("Portée réduite");
                
                // Notifier l'OEC de la réduction de portée
                notificationService.notifyOECScopeReduced(request, scope);
                break;
        }
        
        requestRepository.save(request);
        
        log.info("Décision CAS {} enregistrée pour {}: {}", 
                decisionNumber, request.getReferenceNumber(), decisionType);
        return decision;
    }
    
    /**
     * Délivrer le certificat d'accréditation (après décision d'octroi)
     */
    @Transactional
    public AccreditationCertificate issueCertificate(Long requestId, String certificateNumber,
                                                    String scope, String technicalDomains,
                                                    String methodsAndStandards, String concernedSites,
                                                    String limitations, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        CASDecision casDecision = casDecisionRepository.findFirstByRequest_IdOrderByCreatedAtDesc(requestId)
                .orElseThrow(() -> new RuntimeException("Décision CAS non trouvée"));
        
        LocalDateTime issueDate = LocalDateTime.now();
        LocalDateTime expirationDate = issueDate.plusYears(4); // +4 ans
        
        AccreditationCertificate certificate = AccreditationCertificate.builder()
                .request(request)
                .casDecision(casDecision)
                .certificateNumber(certificateNumber)
                .issueDate(issueDate)
                .expirationDate(expirationDate)
                .oecIdentity(request.getOec().getOrganizationName())
                .scope(scope)
                .technicalDomains(technicalDomains)
                .methodsAndStandards(methodsAndStandards)
                .concernedSites(concernedSites)
                .limitations(limitations)
                .signedByDG(false)
                .signedByDT(false)
                .published(false)
                .build();
        
        certificate = certificateRepository.save(certificate);
        
        request.setStatus(RequestStatus.CERTIFICATE_PREPARATION);
        request.setCertificateIssueDate(issueDate);
        request.setCertificateExpirationDate(expirationDate);
        requestRepository.save(request);
        
        log.info("Certificat {} délivré pour {}", certificateNumber, request.getReferenceNumber());
        return certificate;
    }
    
    /**
     * Signer et publier le certificat
     */
    @Transactional
    public AccreditationCertificate signAndPublishCertificate(Long certificateId, 
                                                             String certificateUrl,
                                                             String technicalAnnexUrl, User currentUser) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
                .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        
        certificate.setSignedByDG(true);
        certificate.setSignedByDT(true);
        certificate.setCertificateUrl(certificateUrl);
        certificate.setTechnicalAnnexUrl(technicalAnnexUrl);
        certificate.setPublished(true);
        
        certificate = certificateRepository.save(certificate);
        
        AccreditationRequest request = certificate.getRequest();
        request.setStatus(RequestStatus.CERTIFICATE_ISSUED);
        request.setCurrentStep("Certificat délivré");
        request.setStatus(RequestStatus.ACTIVE); // Accréditation active
        requestRepository.save(request);
        
        // Créer le plan de surveillance
        createSurveillancePlan(certificate);
        
        // Notifier l'OEC
        notificationService.notifyOECCertificateIssued(request, certificateUrl);
        
        log.info("Certificat {} signé et publié", certificate.getCertificateNumber());
        return certificate;
    }
    
    /**
     * Créer le plan de surveillance (FOR 66)
     */
    private void createSurveillancePlan(AccreditationCertificate certificate) {
        String planCode = "FOR66-" + certificate.getCertificateNumber();
        
        // Calculer la date de première surveillance (généralement 1 an après délivrance)
        LocalDateTime nextSurveillanceDate = certificate.getIssueDate().plusYears(1);
        
        SurveillancePlan plan = SurveillancePlan.builder()
                .certificate(certificate)
                .planCode(planCode)
                .surveillanceCalendar("Annuel")
                .frequency("Annuelle")
                .scopeSampling("Échantillonnage selon PRO 13")
                .estimatedDurationPerEvaluation(3) // 3 jours par défaut
                .nextSurveillanceDate(nextSurveillanceDate)
                .satisfactionFormFOR22Sent(true)
                .build();
        
        surveillancePlanRepository.save(plan);
        
        log.info("Plan de surveillance {} créé", planCode);
    }
}
