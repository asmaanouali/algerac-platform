package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.QuotationRepository;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuotationService {
    
    private final QuotationRepository quotationRepository;
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    /**
     * Créer un nouveau devis par le RA
     */
    @Transactional
    public Quotation createQuotation(Long requestId, BigDecimal amount, String details, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() != null &&
                !request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à créer un devis pour cette demande");
        }
        
        if (request.getStatus() != RequestStatus.RECEIVABLE &&
                request.getStatus() != RequestStatus.QUOTATION_PREPARATION) {
            throw new RuntimeException("La demande doit être à l'état 'Recevable' pour créer un devis. Statut actuel : " + request.getStatus());
        }
        
        String quotationNumber = generateQuotationNumber();
        
        Quotation quotation = Quotation.builder()
                .request(request)
                .quotationNumber(quotationNumber)
                .preparedByRa(currentUser)
                .status(QuotationStatus.DRAFT)
                .amount(amount)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        
        quotation = quotationRepository.save(quotation);
        
        // Mettre à jour le statut de la demande
        request.setStatus(RequestStatus.QUOTATION_PREPARATION);
        request.setProgress(60);
        requestRepository.save(request);
        
        log.info("Devis {} créé pour la demande {} par {}", 
                quotationNumber, request.getReferenceNumber(), currentUser.getFullName());
        
        return quotation;
    }
    
    /**
     * Envoyer le devis au DAG pour approbation
     */
    @Transactional
    public Quotation sendQuotationToDAG(Long quotationId, User currentUser) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));
        
        if (quotation.getPreparedByRa() != null &&
                !quotation.getPreparedByRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à envoyer ce devis");
        }
        
        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            throw new RuntimeException("Ce devis a déjà été envoyé");
        }
        
        quotation.setStatus(QuotationStatus.SENT_TO_DAG);
        quotation.setSentToDagDate(LocalDateTime.now());
        quotation = quotationRepository.save(quotation);
        
        // Mettre à jour le statut de la demande
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_SENT_TO_DAG);
        request.setProgress(65);
        requestRepository.save(request);
        
        // Notifier tous les DAG
        notificationService.notifyDAGNewQuotation(quotation);
        
        log.info("Devis {} envoyé au DAG", quotation.getQuotationNumber());
        
        return quotation;
    }
    
    /**
     * Approuver le devis par le DAG
     */
    @Transactional
    public Quotation approveQuotationByDAG(Long quotationId, String comments, User currentUser) {
        if (currentUser.getRole() != UserRole.valueOf("DAG")) {
            throw new RuntimeException("Seuls les DAG peuvent approuver les devis");
        }
        
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));
        
        if (quotation.getStatus() != QuotationStatus.SENT_TO_DAG) {
            throw new RuntimeException("Ce devis n'est pas en attente d'approbation");
        }
        
        quotation.setStatus(QuotationStatus.APPROVED_BY_DAG);
        quotation.setApprovedByDag(currentUser);
        quotation.setDagComments(comments);
        quotation.setApprovedByDagDate(LocalDateTime.now());
        quotation = quotationRepository.save(quotation);
        
        // Mettre à jour le statut de la demande
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_APPROVED_BY_DAG);
        request.setProgress(75);
        requestRepository.save(request);
        
        // Notifier le RA que le devis est approuvé
        notificationService.notifyRAQuotationApproved(quotation);
        
        log.info("Devis {} approuvé par le DAG {}", 
                quotation.getQuotationNumber(), currentUser.getFullName());
        
        return quotation;
    }
    
    /**
     * Envoyer le devis à l'OEC (avec la convention)
     */
    @Transactional
    public Quotation sendQuotationToOEC(Long quotationId, User currentUser) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));
        
        if (quotation.getPreparedByRa() != null &&
                !quotation.getPreparedByRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à envoyer ce devis");
        }
        
        if (quotation.getStatus() != QuotationStatus.APPROVED_BY_DAG) {
            throw new RuntimeException("Le devis doit être approuvé par le DAG avant envoi à l'OEC");
        }
        
        quotation.setStatus(QuotationStatus.SENT_TO_OEC);
        quotation.setSentToOecDate(LocalDateTime.now());
        quotation = quotationRepository.save(quotation);
        
        // Mettre à jour le statut de la demande
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_SENT_TO_OEC);
        request.setProgress(85);
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECQuotationAndConvention(request);
        
        log.info("Devis {} envoyé à l'OEC", quotation.getQuotationNumber());
        
        return quotation;
    }
    
    /**
     * Valider le devis par l'OEC
     */
    @Transactional
    public Quotation validateQuotationByOEC(Long quotationId, User currentUser) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));
        
        AccreditationRequest request = quotation.getRequest();
        if (request.getOec() != null &&
                !request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à valider ce devis");
        }
        
        if (quotation.getStatus() != QuotationStatus.SENT_TO_OEC) {
            throw new RuntimeException("Ce devis n'est pas en attente de validation");
        }
        
        quotation.setStatus(QuotationStatus.VALIDATED_BY_OEC);
        quotation.setValidatedByOecDate(LocalDateTime.now());
        quotation = quotationRepository.save(quotation);
        
        // Mettre à jour le statut de la demande
        request.setStatus(RequestStatus.QUOTATION_VALIDATED);
        request.setProgress(95);
        requestRepository.save(request);
        
        // Notifier le RA
        notificationService.notifyRAQuotationValidatedByOEC(quotation);
        
        log.info("Devis {} validé par l'OEC {}", 
                quotation.getQuotationNumber(), currentUser.getOrganizationName());
        
        return quotation;
    }
    
    /**
     * Obtenir tous les devis pour une demande
     */
    public List<Quotation> getQuotationsByRequest(Long requestId) {
        return quotationRepository.findByRequest_Id(requestId);
    }
    
    /**
     * Obtenir les devis en attente d'approbation DAG
     */
    public List<Quotation> getPendingDAGApprovalQuotations() {
        return quotationRepository.findByStatus(QuotationStatus.SENT_TO_DAG);
    }
    
    /**
     * Obtenir les devis préparés par un RA
     */
    public List<Quotation> getQuotationsByRA(Long raId) {
        return quotationRepository.findByPreparedByRa_Id(raId);
    }
    
    /**
     * Générer un numéro de devis unique
     */
    private String generateQuotationNumber() {
        String year = String.valueOf(Year.now().getValue());
        int counter = 1;
        String quotationNumber;
        
        do {
            quotationNumber = String.format("DEV-%s-%03d", year, counter);
            counter++;
        } while (quotationRepository.findByQuotationNumber(quotationNumber).isPresent());
        
        return quotationNumber;
    }
}
