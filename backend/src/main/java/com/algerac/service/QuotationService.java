package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.ConventionRepository;
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
    private final ConventionRepository conventionRepository;
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    
    /**
     * Créer une demande d'établissement du devis par le RA
     * Le RA propose la composition de l'équipe et la durée par membre, le montant sera fixé par le DAG
     */
    @Transactional
    public Quotation createQuotation(Long requestId, Integer reeCount, Integer etCount,
                                     Integer eqCount, Integer obsCount, Integer supCount,
                                     Integer expCount, Double evaluationDurationDays,
                                     Double reeDurationDays, Double etDurationDays,
                                     Double eqDurationDays, Double obsDurationDays,
                                     Double supDurationDays, Double expDurationDays,
                                     Boolean cdHelpRequested, String cdHelpMessage,
                                     String details, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() != null &&
                !request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à créer un devis pour cette demande");
        }
        
        if (request.getStatus() != RequestStatus.RECEIVABLE &&
                request.getStatus() != RequestStatus.QUOTATION_PREPARATION &&
                request.getStatus() != RequestStatus.QUOTATION_CONVENTION_CD_MODIF) {
            throw new RuntimeException("La demande doit être à l'état 'Recevable' pour créer un devis. Statut actuel : " + request.getStatus());
        }
        
        String quotationNumber = generateQuotationNumber();
        
        Quotation quotation = Quotation.builder()
                .request(request)
                .quotationNumber(quotationNumber)
                .preparedByRa(currentUser)
                .status(QuotationStatus.DRAFT)
                .amount(BigDecimal.ZERO)
                .reeCount(reeCount != null ? reeCount : 1)
                .etCount(etCount != null ? etCount : 1)
                .eqCount(eqCount != null ? eqCount : 0)
                .obsCount(obsCount != null ? obsCount : 0)
                .supCount(supCount != null ? supCount : 0)
                .expCount(expCount != null ? expCount : 0)
                .evaluationDurationDays(evaluationDurationDays)
                .reeDurationDays(reeDurationDays)
                .etDurationDays(etDurationDays)
                .eqDurationDays(eqDurationDays)
                .obsDurationDays(obsDurationDays)
                .supDurationDays(supDurationDays)
                .expDurationDays(expDurationDays)
                .cdHelpRequested(cdHelpRequested != null ? cdHelpRequested : false)
                .cdHelpMessage(cdHelpMessage)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build();
        
        quotation = quotationRepository.save(quotation);
        
        request.setStatus(RequestStatus.QUOTATION_PREPARATION);
        request.setProgress(60);
        requestRepository.save(request);
        
        // Si le RA demande l'aide du CD, notifier le CD
        if (Boolean.TRUE.equals(cdHelpRequested)) {
            notifyCDHelpRequested(request, currentUser, cdHelpMessage);
        }
        
        log.info("Demande d'établissement du devis {} créée pour la demande {} par {}", 
                quotationNumber, request.getReferenceNumber(), currentUser.getFullName());
        
        return quotation;
    }

    /**
     * RA: modifier une demande de devis encore en brouillon (avant envoi au DAG)
     */
    @Transactional
    public Quotation updateDraftQuotation(Long quotationId, Integer reeCount, Integer etCount,
                                          Integer eqCount, Integer obsCount, Integer supCount,
                                          Integer expCount, Double evaluationDurationDays,
                                          Double reeDurationDays, Double etDurationDays,
                                          Double eqDurationDays, Double obsDurationDays,
                                          Double supDurationDays, Double expDurationDays,
                                          Boolean cdHelpRequested, String cdHelpMessage,
                                          String details, User currentUser) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));

        if (quotation.getPreparedByRa() != null &&
                !quotation.getPreparedByRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier ce devis");
        }

        if (quotation.getStatus() != QuotationStatus.DRAFT) {
            throw new RuntimeException("Ce devis ne peut plus être modifié car il a déjà été envoyé au DAG");
        }

        boolean newlyRequestedCdHelp = Boolean.TRUE.equals(cdHelpRequested)
                && !Boolean.TRUE.equals(quotation.getCdHelpRequested());

        quotation.setReeCount(reeCount != null ? reeCount : 1);
        quotation.setEtCount(etCount != null ? etCount : 1);
        quotation.setEqCount(eqCount != null ? eqCount : 0);
        quotation.setObsCount(obsCount != null ? obsCount : 0);
        quotation.setSupCount(supCount != null ? supCount : 0);
        quotation.setExpCount(expCount != null ? expCount : 0);
        quotation.setEvaluationDurationDays(evaluationDurationDays);
        quotation.setReeDurationDays(reeDurationDays);
        quotation.setEtDurationDays(etDurationDays);
        quotation.setEqDurationDays(eqDurationDays);
        quotation.setObsDurationDays(obsDurationDays);
        quotation.setSupDurationDays(supDurationDays);
        quotation.setExpDurationDays(expDurationDays);
        quotation.setCdHelpRequested(cdHelpRequested != null ? cdHelpRequested : false);
        quotation.setCdHelpMessage(Boolean.TRUE.equals(cdHelpRequested) ? cdHelpMessage : null);
        quotation.setDetails(details);
        quotation = quotationRepository.save(quotation);

        if (newlyRequestedCdHelp) {
            notifyCDHelpRequested(quotation.getRequest(), currentUser, cdHelpMessage);
        }

        log.info("Demande d'établissement du devis {} mise à jour par {}",
                quotation.getQuotationNumber(), currentUser.getFullName());

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
        
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_SENT_TO_DAG);
        request.setProgress(65);
        requestRepository.save(request);
        
        notificationService.notifyDAGNewQuotation(quotation);
        
        log.info("Devis {} envoyé au DAG", quotation.getQuotationNumber());
        
        return quotation;
    }
    
    /**
     * Le DAG définit le montant du devis et l'approuve
     */
    @Transactional
    public Quotation approveQuotationByDAG(Long quotationId, BigDecimal amount, String comments, User currentUser) {
        return approveQuotationByDAG(quotationId, amount, comments, null, null, null, null, null, null, currentUser);
    }

    @Transactional
    public Quotation approveQuotationByDAG(Long quotationId, BigDecimal amount, String comments,
                                            java.util.Map<String, BigDecimal> breakdown,
                                            String devisEstimatifNumber,
                                            java.time.LocalDate devisEstimatifDate,
                                            String siteName, String siteAddress,
                                            User currentUser) {
        return approveQuotationByDAG(quotationId, amount, comments, breakdown, null,
                devisEstimatifNumber, devisEstimatifDate, siteName, siteAddress, currentUser);
    }

    @Transactional
    public Quotation approveQuotationByDAG(Long quotationId, BigDecimal amount, String comments,
                                            java.util.Map<String, BigDecimal> breakdown,
                                            java.util.Map<String, Object> sheet,
                                            String devisEstimatifNumber,
                                            java.time.LocalDate devisEstimatifDate,
                                            String siteName, String siteAddress,
                                            User currentUser) {
        if (currentUser.getRole() != UserRole.DAG) {
            throw new RuntimeException("Seuls les DAG peuvent approuver les devis");
        }

        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));

        if (quotation.getStatus() != QuotationStatus.SENT_TO_DAG) {
            throw new RuntimeException("Ce devis n'est pas en attente d'approbation");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Le montant du devis doit être positif");
        }

        quotation.setAmount(amount);
        quotation.setStatus(QuotationStatus.APPROVED_BY_DAG);
        quotation.setApprovedByDag(currentUser);
        quotation.setDagComments(comments);
        quotation.setApprovedByDagDate(LocalDateTime.now());
        if ((breakdown != null && !breakdown.isEmpty()) || (sheet != null && !sheet.isEmpty())) {
            try {
                if (sheet != null && !sheet.isEmpty()) {
                    java.util.LinkedHashMap<String, Object> payload = new java.util.LinkedHashMap<>();
                    payload.put("amounts", breakdown != null ? breakdown : java.util.Map.of());
                    payload.put("sheet", sheet);
                    quotation.setDevisBreakdownJson(objectMapper.writeValueAsString(payload));
                } else {
                    quotation.setDevisBreakdownJson(objectMapper.writeValueAsString(breakdown));
                }
            } catch (Exception e) {
                log.warn("Impossible de sérialiser le détail du devis: {}", e.getMessage());
            }
        }
        if (devisEstimatifNumber != null && !devisEstimatifNumber.isBlank()) {
            quotation.setDevisEstimatifNumber(devisEstimatifNumber);
        }
        if (devisEstimatifDate != null) {
            quotation.setDevisEstimatifDate(devisEstimatifDate);
        }
        if (siteName != null && !siteName.isBlank()) {
            quotation.setSiteName(siteName);
        }
        if (siteAddress != null && !siteAddress.isBlank()) {
            quotation.setSiteAddress(siteAddress);
        }
        quotation = quotationRepository.save(quotation);
        
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_APPROVED_BY_DAG);
        request.setProgress(70);
        requestRepository.save(request);
        
        // Notifier le RA que le devis est approuvé (sans le montant)
        notificationService.notifyRAQuotationApproved(quotation);
        
        log.info("Devis {} approuvé par le DAG {}", 
                quotation.getQuotationNumber(), currentUser.getFullName());
        
        return quotation;
    }
    
    /**
     * RA demande la validation du CD (quand les deux documents sont prêts)
     */
    @Transactional
    public void requestCDValidation(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() != null &&
                !request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé");
        }
        
        // Vérifier que le devis est approuvé par le DAG
        List<Quotation> quotations = quotationRepository.findByRequest_Id(requestId);
        if (quotations.isEmpty() || quotations.stream().noneMatch(q -> q.getStatus() == QuotationStatus.APPROVED_BY_DAG)) {
            throw new RuntimeException("Le devis doit être approuvé par le DAG avant de demander la validation CD");
        }
        
        // Vérifier que la convention est créée
        List<Convention> conventions = conventionRepository.findByRequest_Id(requestId);
        if (conventions.isEmpty()) {
            throw new RuntimeException("La convention doit être créée avant de demander la validation CD");
        }
        
        // Mettre à jour les statuts
        Quotation quotation = quotations.stream()
                .filter(q -> q.getStatus() == QuotationStatus.APPROVED_BY_DAG)
                .findFirst().get();
        quotation.setStatus(QuotationStatus.PENDING_CD_VALIDATION);
        quotationRepository.save(quotation);
        
        Convention convention = conventions.get(0);
        convention.setStatus(ConventionStatus.PENDING_CD_VALIDATION);
        conventionRepository.save(convention);
        
        request.setStatus(RequestStatus.QUOTATION_CONVENTION_PENDING_CD);
        request.setNextAction("CD doit valider le devis et la convention");
        request.setPendingWith("CD");
        request.setProgress(75);
        requestRepository.save(request);
        
        // Notifier le CD
        notifyCDQuotationConventionReady(request);
        
        log.info("Demande de validation CD pour la demande {}", request.getReferenceNumber());
    }
    
    /**
     * CD valide le devis et la convention et les envoie à l'OEC
     */
    @Transactional
    public void cdValidateAndSendToOEC(Long requestId, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut valider");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.QUOTATION_CONVENTION_PENDING_CD) {
            throw new RuntimeException("La demande n'est pas en attente de validation CD");
        }
        
        List<Quotation> quotations = quotationRepository.findByRequest_Id(requestId);
        Quotation quotation = quotations.stream()
                .filter(q -> q.getStatus() == QuotationStatus.PENDING_CD_VALIDATION)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun devis en attente de validation CD"));
        
        List<Convention> conventions = conventionRepository.findByRequest_Id(requestId);
        Convention convention = conventions.stream()
                .filter(c -> c.getStatus() == ConventionStatus.PENDING_CD_VALIDATION)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune convention en attente de validation CD"));
        
        quotation.setStatus(QuotationStatus.CD_VALIDATED);
        quotationRepository.save(quotation);
        
        convention.setStatus(ConventionStatus.CD_VALIDATED);
        conventionRepository.save(convention);
        
        // Envoyer à l'OEC
        quotation.setStatus(QuotationStatus.SENT_TO_OEC);
        quotation.setSentToOecDate(LocalDateTime.now());
        quotationRepository.save(quotation);
        
        convention.setStatus(ConventionStatus.SENT_TO_OEC);
        convention.setSentToOecDate(LocalDateTime.now());
        conventionRepository.save(convention);
        
        request.setStatus(RequestStatus.QUOTATION_SENT_TO_OEC);
        request.setNextAction("OEC doit valider le devis et signer la convention (délai: 10 jours)");
        request.setPendingWith("OEC");
        request.setCurrentStep("quotation_convention_sent_to_oec");
        request.setNextActionDate(LocalDateTime.now().plusDays(10));
        request.setProgress(80);
        requestRepository.save(request);
        
        notificationService.notifyOECQuotationAndConvention(request);
        
        log.info("CD {} a validé et envoyé devis+convention à l'OEC pour {}", 
                currentUser.getFullName(), request.getReferenceNumber());
    }
    
    /**
     * CD demande des modifications au RA
     */
    @Transactional
    public void cdRequestModifications(Long requestId, String comments, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut demander des modifications");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.QUOTATION_CONVENTION_PENDING_CD) {
            throw new RuntimeException("La demande n'est pas en attente de validation CD");
        }
        
        request.setStatus(RequestStatus.QUOTATION_CONVENTION_CD_MODIF);
        request.setNextAction("RA doit effectuer les modifications demandées par le CD");
        request.setPendingWith("RA");
        request.setProgress(72);
        requestRepository.save(request);
        
        // Notifier le RA
        if (request.getAssignedToRa() != null) {
            notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Modifications demandées par le CD",
                    "Le CD demande des modifications sur le devis/convention pour " + 
                    request.getReferenceNumber() + ". " + (comments != null ? comments : ""),
                    "warning"
            );
        }
        
        log.info("CD {} a demandé des modifications pour {}", 
                currentUser.getFullName(), request.getReferenceNumber());
    }
    
    /**
     * CD contacte un expert par email pour aider à estimer la durée
     */
    @Transactional
    public void cdContactExpert(Long requestId, String expertEmail, String message, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut contacter un expert");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        // On ne gère pas réellement l'envoi d'email, on crée une notification
        // et on log l'action. En production, on enverrait un vrai email.
        log.info("CD {} envoie un email à l'expert {} pour la demande {} : {}", 
                currentUser.getFullName(), expertEmail, request.getReferenceNumber(), message);
        
        // Notifier le RA que le CD a contacté un expert
        if (request.getAssignedToRa() != null) {
            notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Expert contacté par le CD",
                    "Le CD a contacté un expert (" + expertEmail + ") pour vous aider à estimer la durée d'évaluation de " + request.getReferenceNumber(),
                    "info"
            );
        }
    }
    
    /**
     * Envoyer le devis à l'OEC (avec la convention) — appelé par CD après validation
     */
    @Transactional
    public Quotation sendQuotationToOEC(Long quotationId, User currentUser) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new RuntimeException("Devis non trouvé"));
        
        if (quotation.getStatus() != QuotationStatus.CD_VALIDATED &&
                quotation.getStatus() != QuotationStatus.APPROVED_BY_DAG) {
            throw new RuntimeException("Le devis doit être validé par le CD avant envoi à l'OEC");
        }
        
        quotation.setStatus(QuotationStatus.SENT_TO_OEC);
        quotation.setSentToOecDate(LocalDateTime.now());
        quotation = quotationRepository.save(quotation);
        
        AccreditationRequest request = quotation.getRequest();
        request.setStatus(RequestStatus.QUOTATION_SENT_TO_OEC);
        request.setProgress(80);
        requestRepository.save(request);
        
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
        
        request.setStatus(RequestStatus.QUOTATION_VALIDATED);
        request.setProgress(90);
        requestRepository.save(request);
        
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

    public Quotation getQuotationById(Long id) {
        return quotationRepository.findById(id).orElse(null);
    }
    
    /**
     * Obtenir les devis en attente d'approbation DAG
     */
    public List<Quotation> getPendingDAGApprovalQuotations() {
        return quotationRepository.findByStatus(QuotationStatus.SENT_TO_DAG);
    }

    /**
     * Obtenir tous les devis établis par la DAG (montant fixé).
     */
    public List<Quotation> getEstablishedByDAGQuotations() {
        return quotationRepository.findByApprovedByDagIsNotNull();
    }

    /**
     * Obtenir les devis établis par un DAG donné.
     */
    public List<Quotation> getQuotationsByDAG(Long dagId) {
        return quotationRepository.findByApprovedByDag_Id(dagId);
    }
    
    /**
     * Obtenir les devis en attente de validation CD
     */
    public List<Quotation> getPendingCDValidationQuotations() {
        return quotationRepository.findByStatus(QuotationStatus.PENDING_CD_VALIDATION);
    }
    
    /**
     * Obtenir les devis préparés par un RA
     */
    public List<Quotation> getQuotationsByRA(Long raId) {
        return quotationRepository.findByPreparedByRa_Id(raId);
    }
    
    // ── Notification helpers ──────────────────────────────────────────────
    
    private void notifyCDHelpRequested(AccreditationRequest request, User ra, String message) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            notificationService.createNotification(
                    cd.getId(),
                    "Aide demandée pour estimation durée",
                    "Le RA " + ra.getFullName() + " demande de l'aide pour estimer la durée d'évaluation de " +
                    request.getReferenceNumber() + ". " + (message != null ? message : ""),
                    "warning"
            );
        }
    }
    
    private void notifyCDQuotationConventionReady(AccreditationRequest request) {
        List<User> cds = userRepository.findByRole(UserRole.CD);
        for (User cd : cds) {
            notificationService.createNotification(
                    cd.getId(),
                    "Devis et convention à valider",
                    "Le devis et la convention pour la demande " + request.getReferenceNumber() + 
                    " sont prêts pour votre validation. Vérifiez et envoyez à l'OEC ou demandez des modifications.",
                    "info"
            );
        }
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
