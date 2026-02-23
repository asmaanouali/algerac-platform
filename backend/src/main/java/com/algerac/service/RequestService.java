package com.algerac.service;

import com.algerac.dto.AssignRequestDTO;
import com.algerac.dto.CreateRequestDTO;
import com.algerac.dto.NewRequestDTO;
import com.algerac.dto.ReceivabilityDecisionDTO;
import com.algerac.model.*;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequestService {
    
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    public List<AccreditationRequest> getAllRequests() {
        return requestRepository.findAll();
    }
    
    public List<AccreditationRequest> getRequestsByOec(Long oecId) {
        return requestRepository.findByOec_Id(oecId);
    }
    
    public List<AccreditationRequest> getRequestsByStatus(RequestStatus status) {
        return requestRepository.findByStatus(status);
    }
    
    public List<AccreditationRequest> getRequestsAssignedToRa(Long raId) {
        return requestRepository.findByAssignedToRa_Id(raId);
    }
    
    public Optional<AccreditationRequest> getRequest(Long id) {
        return requestRepository.findById(id);
    }
    
    /**
     * Création d'une nouvelle demande par un OEC
     */
    @Transactional
    public AccreditationRequest createNewRequest(NewRequestDTO dto, User currentUser) {
        if (currentUser.getRole() != UserRole.OEC) {
            throw new RuntimeException("Seuls les OEC peuvent créer des demandes");
        }
        
        AccreditationRequest request = AccreditationRequest.builder()
                .oec(currentUser)
                .type(dto.getType())
                .domain(dto.getDomain())
                .description(dto.getDescription())
                .status(RequestStatus.DRAFT)
                .progress(0)
                .createdAt(LocalDateTime.now())
                .build();
        
        request = requestRepository.save(request);
        log.info("Nouvelle demande créée en brouillon par l'OEC {}", currentUser.getOrganizationName());
        
        return request;
    }
    
    /**
     * Soumission de la demande par l'OEC (après remplissage du formulaire)
     */
    @Transactional
    public AccreditationRequest submitRequest(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à soumettre cette demande");
        }
        
        if (request.getStatus() != RequestStatus.DRAFT) {
            throw new RuntimeException("Cette demande a déjà été soumise");
        }
        
        request.setStatus(RequestStatus.SUBMITTED);
        request.setSubmissionDate(LocalDateTime.now());
        request.setProgress(10);
        
        // Après soumission, la demande passe en attente de paiement
        request.setStatus(RequestStatus.PENDING_PAYMENT);
        
        request = requestRepository.save(request);
        log.info("Demande {} soumise par l'OEC {}", request.getId(), currentUser.getOrganizationName());
        
        return request;
    }
    
    /**
     * Assignation d'une demande à un RA par le CD (sans numéro de référence)
     */
    @Transactional
    public AccreditationRequest assignRequestToRA(Long requestId, AssignRequestDTO dto, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls les chefs de département peuvent assigner des demandes");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.PAYMENT_COMPLETED) {
            throw new RuntimeException("Le paiement doit être complété avant l'assignation");
        }
        
        User ra = userRepository.findById(dto.getRaId())
                .orElseThrow(() -> new RuntimeException("RA non trouvé"));
        
        if (ra.getRole() != UserRole.RA) {
            throw new RuntimeException("L'utilisateur sélectionné n'est pas un RA");
        }
        
        request.setAssignedToRa(ra);
        request.setAssignmentDate(LocalDateTime.now());
        request.setStatus(RequestStatus.ASSIGNED_TO_RA);
        request.setProgress(25);
        
        // Le CD attribue automatiquement un numéro de dossier séquentiel et unique
        if (request.getReferenceNumber() == null || request.getReferenceNumber().isEmpty()) {
            String referenceNumber = generateReferenceNumber();
            request.setReferenceNumber(referenceNumber);
            log.info("Numéro de dossier {} attribué automatiquement par le CD", referenceNumber);
        }
        
        request = requestRepository.save(request);
        log.info("Demande ID {} assignée au RA {} par {}", 
                request.getId(), ra.getFullName(), currentUser.getFullName());
        
        // Notifier le RA
        notificationService.notifyRAAssignment(request);
        
        return request;
    }
    
    /**
     * Attribution d'un numéro de référence par le RA
     */
    @Transactional
    public AccreditationRequest setReferenceNumberByRA(Long requestId, String referenceNumber, User currentUser) {
        if (currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls les RAs peuvent attribuer des numéros de référence");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.ASSIGNED_TO_RA) {
            throw new RuntimeException("La demande doit être assignée à un RA");
        }
        
        if (!request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous ne pouvez attribuer un numéro qu'aux demandes qui vous sont assignées");
        }
        
        if (request.getReferenceNumber() != null && !request.getReferenceNumber().isEmpty()) {
            throw new RuntimeException("Cette demande a déjà un numéro de référence");
        }
        
        // Vérifier que le numéro n'existe pas déjà
        if (requestRepository.findByReferenceNumber(referenceNumber).isPresent()) {
            throw new RuntimeException("Ce numéro de référence existe déjà");
        }
        
        request.setReferenceNumber(referenceNumber);
        request.setProgress(30);
        
        request = requestRepository.save(request);
        log.info("Numéro de référence {} attribué à la demande ID {} par le RA {}", 
                referenceNumber, request.getId(), currentUser.getFullName());
        
        return request;
    }
    
    /**
     * Début de l'étude de recevabilité par le RA
     */
    @Transactional
    public AccreditationRequest startReceivabilityStudy(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Cette demande ne vous est pas assignée");
        }
        
        if (request.getStatus() != RequestStatus.ASSIGNED_TO_RA) {
            throw new RuntimeException("La demande n'est pas au bon statut pour commencer l'étude");
        }
        
        request.setStatus(RequestStatus.RECEIVABILITY_STUDY);
        request.setProgress(40);
        
        request = requestRepository.save(request);
        log.info("Étude de recevabilité commencée pour la demande {} par {}", 
                request.getReferenceNumber(), currentUser.getFullName());
        
        return request;
    }
    
    /**
     * Décision de recevabilité par le RA
     */
    @Transactional
    public AccreditationRequest makeReceivabilityDecision(Long requestId, ReceivabilityDecisionDTO dto, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à prendre cette décision");
        }
        
        if (request.getStatus() != RequestStatus.RECEIVABILITY_STUDY 
            && request.getStatus() != RequestStatus.RECEIVABILITY_RESUBMITTED) {
            throw new RuntimeException("La demande n'est pas en étude de recevabilité");
        }
        
        request.setReceivabilityComments(dto.getComments());
        request.setReceivabilityDecisionDate(LocalDateTime.now());
        request.setIsReceivable(dto.getIsReceivable());
        
        if (dto.getIsReceivable()) {
            // Demande recevable
            request.setStatus(RequestStatus.RECEIVABLE);
            request.setProgress(60);
            request.setCurrentPhase("Recevabilité");
            request.setCurrentStep("Déclarée recevable");
            request.setNextAction("Visite préliminaire ou contractualisation");
            request.setPendingWith("RA/CD");
        } else {
            // Demande non recevable - OEC peut corriger
            request.setStatus(RequestStatus.NOT_RECEIVABLE);
            request.setReceivabilityCorrectionNeeded(dto.getComments());
            request.setCorrectionDeadline(LocalDateTime.now().plusDays(30)); // 30 jours pour corriger
            request.setProgress(40);
            request.setCurrentPhase("Recevabilité");
            request.setCurrentStep("Non recevable - correction requise");
            request.setNextAction("OEC doit corriger et resoumettre");
            request.setPendingWith("OEC");
            
            if (request.getReceivabilityAttempts() == null) {
                request.setReceivabilityAttempts(1);
            } else {
                request.setReceivabilityAttempts(request.getReceivabilityAttempts() + 1);
            }
        }
        
        request = requestRepository.save(request);
        log.info("Décision de recevabilité prise pour la demande {} : {}", 
                request.getReferenceNumber(), dto.getIsReceivable() ? "RECEVABLE" : "NON RECEVABLE");
        
        // Notifier l'OEC
        notificationService.notifyOECReceivabilityDecision(request, dto.getIsReceivable());
        
        return request;
    }
    
    /**
     * OEC soumet les corrections pour une demande non recevable
     */
    @Transactional
    public AccreditationRequest submitReceivabilityCorrections(Long requestId, String corrections, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette demande");
        }
        
        if (request.getStatus() != RequestStatus.NOT_RECEIVABLE) {
            throw new RuntimeException("Cette demande n'est pas en attente de correction");
        }
        
        // Vérifier le délai
        if (request.getCorrectionDeadline() != null && LocalDateTime.now().isAfter(request.getCorrectionDeadline())) {
            throw new RuntimeException("Le délai de correction est dépassé");
        }
        
        request.setStatus(RequestStatus.RECEIVABILITY_RESUBMITTED);
        request.setCorrectionSubmittedDate(LocalDateTime.now());
        request.setDescription(corrections); // Mise à jour avec les corrections
        request.setProgress(45);
        request.setCurrentPhase("Recevabilité");
        request.setCurrentStep("Corrections soumises - nouvelle étude");
        request.setNextAction("RA doit réévaluer la recevabilité");
        request.setPendingWith("RA");
        
        request = requestRepository.save(request);
        log.info("Corrections soumises pour la demande {} par l'OEC {}", 
                request.getReferenceNumber(), currentUser.getOrganizationName());
        
        // Notifier le RA
        notificationService.notifyRANewCorrections(request);
        
        return request;
    }
    
    @Transactional
    public AccreditationRequest createRequest(CreateRequestDTO dto, User currentUser) {
        // Determine OEC
        Long oecId = dto.getOecId() != null ? dto.getOecId() : currentUser.getId();
        User oec = userRepository.findById(oecId)
                .orElseThrow(() -> new RuntimeException("OEC non trouvé"));
        
        // Le numéro de dossier sera attribué par le CD lors de l'assignation
        
        AccreditationRequest request = AccreditationRequest.builder()
                .oec(oec)
                .type(dto.getType())
                .domain(dto.getDomain())
                .status(dto.getStatus() != null ? dto.getStatus() : RequestStatus.DRAFT)
                .progress(dto.getProgress() != null ? dto.getProgress() : 0)
                .createdAt(LocalDateTime.now())
                .build();
        
        request = requestRepository.save(request);
        log.info("Nouvelle demande créée : {}", request.getReferenceNumber());
        
        return request;
    }
    
    private String generateReferenceNumber() {
        String year = String.valueOf(Year.now().getValue());
        int counter = 1;
        String refNumber;
        
        do {
            refNumber = String.format("D-%s-%03d", year, counter);
            counter++;
        } while (requestRepository.existsByReferenceNumber(refNumber));
        
        return refNumber;
    }
    
    @Transactional
    public AccreditationRequest updateRequest(Long id, AccreditationRequest updates) {
        AccreditationRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (updates.getStatus() != null) {
            request.setStatus(updates.getStatus());
        }
        if (updates.getProgress() != null) {
            request.setProgress(updates.getProgress());
        }
        if (updates.getSubmissionDate() != null) {
            request.setSubmissionDate(updates.getSubmissionDate());
        }
        if (updates.getNextActionDate() != null) {
            request.setNextActionDate(updates.getNextActionDate());
        }
        
        return requestRepository.save(request);
    }
}