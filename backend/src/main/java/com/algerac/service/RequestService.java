package com.algerac.service;

import com.algerac.dto.AssignRequestDTO;
import com.algerac.dto.CreateRequestDTO;
import com.algerac.dto.NewRequestDTO;
import com.algerac.dto.ReceivabilityDecisionDTO;
import com.algerac.model.*;
import com.algerac.repository.DepartmentRepository;
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
    private final DepartmentRepository departmentRepository;
    
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
     * Création + soumission directe d'une demande pour un OEC qui n'a pas encore
     * de compte (inscription via /oecregister). La demande est immédiatement placée
     * en PENDING_DT_REVIEW pour être visible dans la liste des demandes du DT.
     */
    @Transactional
    public AccreditationRequest createAndSubmitForNewOec(User pendingOec, RequestType type, String domain, String description) {
        AccreditationRequest request = AccreditationRequest.builder()
                .oec(pendingOec)
                .type(type != null ? type : RequestType.INITIAL)
                .domain(domain != null && !domain.isBlank() ? domain : "À définir")
                .description(description)
                .status(RequestStatus.PENDING_DT_REVIEW)
                .progress(5)
                .currentPhase("INITIAL")
                .currentStep("En attente de vérification DT")
                .nextAction("Le dossier doit être vérifié par la Direction Technique")
                .pendingWith("DT")
                .submissionDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .sequenceNumber(nextSequenceNumber())
                .build();

        request = requestRepository.save(request);
        log.info("Demande créée+soumise (nouvel OEC sans compte) #{} pour {}",
                request.getSequenceNumber(),
                pendingOec.getOrganizationName());

        // Notifier le DT qu'une nouvelle demande nécessite la vérification des documents
        notificationService.notifyDTNewRequest(request);

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
        
        request.setStatus(RequestStatus.PENDING_DT_REVIEW);
        request.setSubmissionDate(LocalDateTime.now());
        request.setProgress(5);
        request.setNextAction("Votre dossier est en cours d'examen par la Direction Technique");
        request.setPendingWith("DT");

        // At submission we only assign a simple sequential number.
        // The final accreditation ID (AC/<domain>/<seq>/<year>) is composed
        // later by the RA after the dossier is accepted — see assignFinalAccreditationReference.
        if (request.getSequenceNumber() == null) {
            request.setSequenceNumber(nextSequenceNumber());
        }

        request = requestRepository.save(request);
        log.info("Demande séquence #{} soumise par l'OEC {}", request.getSequenceNumber(), currentUser.getOrganizationName());
        
        // Notifier le DT qu'une nouvelle demande nécessite la vérification des documents
        notificationService.notifyDTNewRequest(request);
        
        return request;
    }
    
    /**
     * DT: Vérification des documents de la demande
     * Si validés → PENDING_CD_ASSIGNMENT (envoi au CD selon le domaine)
     * Si rejetés → DT_REJECTED (retour à l'OEC)
     */
    @Transactional
    public AccreditationRequest dtReviewRequest(Long requestId, boolean approved, String comments, User currentUser) {
        if (currentUser.getRole() != UserRole.DT) {
            throw new RuntimeException("Seul le DT peut vérifier les documents des demandes");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.PENDING_DT_REVIEW) {
            throw new RuntimeException("Cette demande n'est pas en attente de vérification DT");
        }
        
        request.setDtReviewComments(comments);
        request.setDtReviewDate(LocalDateTime.now());
        
        if (approved) {
            request.setStatus(RequestStatus.PENDING_CD_ASSIGNMENT);
            request.setProgress(10);
            request.setCurrentPhase("INITIAL");
            request.setCurrentStep("Documents validés par DT");
            request.setNextAction("CD doit choisir un RA pour traiter cette demande");
            request.setPendingWith("CD");
            
            request = requestRepository.save(request);
            log.info("DT a validé les documents de la demande {}", request.getReferenceNumber());
            
            // Notifier le(s) CD concerné(s) par le domaine
            notificationService.notifyCDAfterDTApproval(request);

            // Cas particulier : nouvel OEC inscrit via /oecregister sans compte (User en PENDING).
            // Demander à l'admin de créer le compte. La demande continue son flux normal vers le CD.
            User oecUser = request.getOec();
            if (oecUser != null && oecUser.getStatus() == UserStatus.PENDING) {
                notificationService.notifyAdminCreateOECAccount(request);
            }
        } else {
            request.setStatus(RequestStatus.DT_REJECTED);
            request.setProgress(3);
            request.setCurrentPhase("INITIAL");
            request.setCurrentStep("Documents rejetés par DT");
            request.setNextAction("OEC doit corriger et resoumettre les documents");
            request.setPendingWith("OEC");
            
            request = requestRepository.save(request);
            log.info("DT a rejeté les documents de la demande {}", request.getReferenceNumber());
            
            // Notifier l'OEC du rejet
            notificationService.notifyOECDTRejection(request, comments);
        }
        
        return request;
    }
    
    /**
     * DT: explicitly assign a validated request to a specific CD of a given
     * department. Called after dtReviewRequest(approved=true) — or as the
     * combined validation step. The DT picks from CDs of the target
     * department only.
     */
    @Transactional
    public AccreditationRequest dtAssignRequestToCd(Long requestId, Long departmentId, Long cdUserId,
                                                    String comments, User currentUser) {
        if (currentUser.getRole() != UserRole.DT) {
            throw new RuntimeException("Seul le DT peut assigner une demande à un CD");
        }
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        if (request.getStatus() != RequestStatus.PENDING_CD_ASSIGNMENT
                && request.getStatus() != RequestStatus.DT_APPROVED
                && request.getStatus() != RequestStatus.PENDING_DT_REVIEW
                && request.getStatus() != RequestStatus.SUBMITTED) {
            throw new RuntimeException("Cette demande n'est pas en état d'être assignée à un CD");
        }
        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Département introuvable"));
        User cd = userRepository.findById(cdUserId)
                .orElseThrow(() -> new RuntimeException("CD introuvable"));
        if (!(cd.getRole() == UserRole.CD || cd.hasRole(UserRole.CD))) {
            throw new RuntimeException("L'utilisateur choisi n'est pas un CD");
        }
        if (cd.getDepartment() == null || !cd.getDepartment().getId().equals(dept.getId())) {
            throw new RuntimeException("Le CD sélectionné n'appartient pas au département choisi");
        }

        request.setDepartment(dept);
        request.setAssignedToCd(cd);
        if (comments != null && !comments.isBlank()) {
            request.setDtReviewComments(comments);
        }
        request.setDtReviewDate(LocalDateTime.now());
        request.setStatus(RequestStatus.PENDING_CD_ASSIGNMENT);
        request.setProgress(Math.max(12, request.getProgress() == null ? 0 : request.getProgress()));
        request.setCurrentPhase("INITIAL");
        request.setCurrentStep("Assignée à un CD");
        request.setNextAction("CD doit choisir un RA pour traiter cette demande");
        request.setPendingWith("CD");
        request = requestRepository.save(request);

        notificationService.notifyCDAfterDTApproval(request);
        log.info("DT a assigné la demande #{} au CD {} (département {})", request.getId(), cd.getFullName(), dept.getName());
        return request;
    }

    /** Backwards-compatible overload. */
    @Transactional
    public AccreditationRequest dtAssignRequestToCd(Long requestId, Long departmentId, Long cdUserId, User currentUser) {
        return dtAssignRequestToCd(requestId, departmentId, cdUserId, null, currentUser);
    }

    /**
     * RA: once a dossier has been accepted and before evaluation begins, the RA
     * assigns the final accreditation reference in the form AC/<domaine>/<seq>/<année>.
     * Before this step, the request only carries a sequenceNumber.
     */
    @Transactional
    public AccreditationRequest assignFinalAccreditationReference(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        boolean isRaOnRequest = request.getAssignedToRa() != null
                && request.getAssignedToRa().getId().equals(currentUser.getId());
        if (!isRaOnRequest && currentUser.getRole() != UserRole.ADMIN) {
            throw new RuntimeException("Seul le RA assigné peut attribuer la référence finale");
        }
        if (request.getReferenceNumber() != null && !request.getReferenceNumber().isBlank()) {
            return request; // already assigned — idempotent
        }
        String ref = generateReferenceNumber(request.getDomain());
        request.setReferenceNumber(ref);
        request = requestRepository.save(request);
        log.info("Référence finale {} attribuée à la demande #{} par {}", ref, request.getId(), currentUser.getFullName());
        return request;
    }

    private synchronized Integer nextSequenceNumber() {
        return requestRepository.findTopBySequenceNumberIsNotNullOrderBySequenceNumberDesc()
                .map(r -> r.getSequenceNumber() + 1)
                .orElse(1);
    }

    /**
     * OEC: Resoumettre après rejet DT
     */
    @Transactional
    public AccreditationRequest resubmitAfterDTRejection(Long requestId, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à modifier cette demande");
        }
        
        if (request.getStatus() != RequestStatus.DT_REJECTED) {
            throw new RuntimeException("Cette demande n'est pas en attente de correction");
        }
        
        request.setStatus(RequestStatus.PENDING_DT_REVIEW);
        request.setProgress(5);
        request.setCurrentPhase("INITIAL");
        request.setCurrentStep("Documents corrigés - nouvelle vérification");
        request.setNextAction("Votre dossier corrigé est en cours d'examen par la Direction Technique");
        request.setPendingWith("DT");
        
        request = requestRepository.save(request);
        log.info("OEC a resoumis la demande {} après rejet DT", request.getReferenceNumber());
        
        notificationService.notifyDTNewRequest(request);
        
        return request;
    }
    
    /**
     * Assignation d'une demande à un RA par le CD
     * Également envoi au DAG pour fixer les frais d'enregistrement
     */
    @Transactional
    public AccreditationRequest assignRequestToRA(Long requestId, AssignRequestDTO dto, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls les chefs de département peuvent assigner des demandes");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.PENDING_CD_ASSIGNMENT && request.getStatus() != RequestStatus.PAYMENT_COMPLETED) {
            throw new RuntimeException("Cette demande n'est pas en attente d'assignation");
        }
        
        User ra = userRepository.findById(dto.getRaId())
                .orElseThrow(() -> new RuntimeException("RA non trouvé"));
        
        if (ra.getRole() != UserRole.RA) {
            throw new RuntimeException("L'utilisateur sélectionné n'est pas un RA");
        }
        
        request.setAssignedToRa(ra);
        request.setAssignedToCd(currentUser);
        request.setAssignmentDate(LocalDateTime.now());
        request.setStatus(RequestStatus.ASSIGNED_TO_RA);
        request.setProgress(15);
        request.setCurrentPhase("INITIAL");
        request.setCurrentStep("Assignée au RA");
        request.setNextAction("RA doit commencer l'étude de recevabilité");
        request.setPendingWith("RA");

        // Générer automatiquement la référence AC/<domaine>/<seq>/<année> à l'assignation
        if (request.getReferenceNumber() == null || request.getReferenceNumber().isBlank()) {
            String ref = generateReferenceNumber(request.getDomain());
            request.setReferenceNumber(ref);
            log.info("Référence {} générée automatiquement pour la demande #{} lors de l'assignation au RA",
                    ref, request.getId());
        }

        request = requestRepository.save(request);
        log.info("Demande {} assignée au RA {} par CD {}", 
                request.getReferenceNumber(), ra.getFullName(), currentUser.getFullName());
        
        // Notifier le RA
        notificationService.notifyRAAssignment(request);
        
        // Aussi envoyer au DAG pour fixer les frais d'enregistrement (en parallèle)
        notificationService.notifyDAGNewRequest(request);
        
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
        if (currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls les RAs peuvent commencer l'étude de recevabilité");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() == null || !request.getAssignedToRa().getId().equals(currentUser.getId())) {
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
     * Décision de recevabilité par le RA — envoyée au CD pour validation avant notification OEC
     */
    @Transactional
    public AccreditationRequest makeReceivabilityDecision(Long requestId, ReceivabilityDecisionDTO dto, User currentUser) {
        if (currentUser.getRole() != UserRole.RA) {
            throw new RuntimeException("Seuls les RAs peuvent prendre cette décision");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() == null || !request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à prendre cette décision");
        }
        
        if (request.getStatus() != RequestStatus.RECEIVABILITY_STUDY 
            && request.getStatus() != RequestStatus.RECEIVABILITY_RESUBMITTED) {
            throw new RuntimeException("La demande n'est pas en étude de recevabilité");
        }
        
        // Stocker la décision du RA mais ne pas l'appliquer directement
        request.setReceivabilityComments(dto.getComments());
        request.setReceivabilityDecisionDate(LocalDateTime.now());
        request.setIsReceivable(dto.getIsReceivable());
        
        // Envoyer au CD pour validation au lieu de notifier l'OEC directement
        request.setStatus(RequestStatus.RECEIVABILITY_PENDING_CD_REVIEW);
        request.setProgress(50);
        request.setCurrentPhase("Recevabilité");
        request.setCurrentStep("En attente validation CD");
        request.setNextAction("CD doit valider l'étude de recevabilité du RA");
        request.setPendingWith("CD");
        
        request = requestRepository.save(request);
        log.info("Étude de recevabilité soumise au CD pour la demande {} : proposition {}", 
                request.getReferenceNumber(), dto.getIsReceivable() ? "RECEVABLE" : "NON RECEVABLE");
        
        // Notifier le CD qu'une étude à valider est disponible
        notificationService.notifyCDReceivabilityStudyReady(request, currentUser.getFullName(), dto.getIsReceivable());
        
        return request;
    }
    
    /**
     * CD: Valider ou demander des modifications sur l'étude de recevabilité du RA
     */
    @Transactional
    public AccreditationRequest cdReviewReceivability(Long requestId, boolean approved, String cdComments, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls les CD peuvent valider l'étude de recevabilité");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getStatus() != RequestStatus.RECEIVABILITY_PENDING_CD_REVIEW) {
            throw new RuntimeException("Cette demande n'est pas en attente de validation CD");
        }
        
        if (approved) {
            // CD approuve → appliquer la décision du RA et notifier l'OEC
            if (Boolean.TRUE.equals(request.getIsReceivable())) {
                request.setStatus(RequestStatus.RECEIVABLE);
                request.setProgress(60);
                request.setCurrentPhase("Recevabilité");
                request.setCurrentStep("Déclarée recevable");
                request.setNextAction("Visite préliminaire ou contractualisation");
                request.setPendingWith("RA/CD");
            } else {
                request.setStatus(RequestStatus.NOT_RECEIVABLE);
                request.setReceivabilityCorrectionNeeded(request.getReceivabilityComments());
                request.setCorrectionDeadline(LocalDateTime.now().plusDays(30));
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
            
            if (cdComments != null && !cdComments.isBlank()) {
                request.setReceivabilityComments(
                    request.getReceivabilityComments() + "\n\n[Avis CD] " + cdComments
                );
            }
            
            request = requestRepository.save(request);
            log.info("CD a approuvé l'étude de recevabilité pour {} : {}", 
                    request.getReferenceNumber(), request.getIsReceivable() ? "RECEVABLE" : "NON RECEVABLE");
            
            // Maintenant notifier l'OEC de la décision
            notificationService.notifyOECReceivabilityDecision(request, request.getIsReceivable());
            // Notifier le RA que le CD a validé
            notificationService.notifyRAReceivabilityReviewResult(request, true, null);
        } else {
            // CD demande des modifications → renvoyer au RA
            request.setStatus(RequestStatus.RECEIVABILITY_STUDY);
            request.setProgress(40);
            request.setCurrentPhase("Recevabilité");
            request.setCurrentStep("Modifications demandées par CD");
            request.setNextAction("RA doit modifier l'étude de recevabilité selon les remarques du CD");
            request.setPendingWith("RA");
            
            if (cdComments != null && !cdComments.isBlank()) {
                request.setReceivabilityComments(
                    request.getReceivabilityComments() + "\n\n[Remarques CD] " + cdComments
                );
            }
            
            request = requestRepository.save(request);
            log.info("CD a demandé des modifications sur l'étude de recevabilité pour {}", 
                    request.getReferenceNumber());
            
            // Notifier le RA des modifications demandées
            notificationService.notifyRAReceivabilityReviewResult(request, false, cdComments);
        }
        
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
        
        if (request.getStatus() != RequestStatus.NOT_RECEIVABLE && request.getStatus() != RequestStatus.RECEIVABILITY_CORRECTION) {
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
                .status(RequestStatus.DRAFT)
                .progress(0)
                .createdAt(LocalDateTime.now())
                .build();
        
        request = requestRepository.save(request);
        log.info("Nouvelle demande créée : {}", request.getReferenceNumber());
        
        return request;
    }
    
    /**
     * Génère un numéro de référence au format AC/DOMAINE/NUMSEQUENTIEL/ANNEE
     * Ex: AC/ES/001/26 (première demande d'essais en 2026)
     * Le compteur est remis à zéro chaque année et par domaine.
     */
    private synchronized String generateReferenceNumber(String domain) {
        String domainCode = mapDomainToCode(domain);
        String yearSuffix = String.valueOf(Year.now().getValue()).substring(2); // "26" for 2026

        // Count only references for this domain AND this year (e.g. AC/ES/%/26)
        String likePattern = "AC/" + domainCode + "/%/" + yearSuffix;
        long count = requestRepository.countByReferenceNumberLike(likePattern);

        String refNumber = String.format("AC/%s/%03d/%s", domainCode, count + 1, yearSuffix);

        // Ensure uniqueness in the rare case of concurrent inserts
        while (requestRepository.existsByReferenceNumber(refNumber)) {
            count++;
            refNumber = String.format("AC/%s/%03d/%s", domainCode, count + 1, yearSuffix);
        }

        return refNumber;
    }
    
    /**
     * Mappe le domaine (libellé ou code d'activité) vers un code court pour la référence
     */
    private String mapDomainToCode(String domain) {
        if (domain == null || domain.isEmpty()) return "GN"; // Général
        
        String d = domain.toLowerCase().trim();
        
        // Match labels or codes
        if (d.contains("inspection")) return "IN";
        if (d.contains("essais") && d.contains("aptitude")) return "EA";
        if (d.contains("essais") || d.equals("essais")) return "ES";
        if (d.contains("étalonnage") || d.contains("etalonnage")) return "ET";
        if (d.contains("examens") || d.contains("médicaux") || d.contains("medicaux") || d.contains("biomédical") || d.contains("biomedical")) return "EM";
        if (d.contains("cert") && (d.contains("sm") || d.contains("système") || d.contains("management"))) return "SM";
        if (d.contains("cert") && (d.contains("produit") || d.contains("procédé") || d.contains("service"))) return "CP";
        if (d.contains("cert") && d.contains("personne")) return "CE";
        
        return "GN"; // Domaine général
    }
    
    @Transactional
    public AccreditationRequest updateRequest(Long id, AccreditationRequest updates, User currentUser) {
        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls les administrateurs et CD peuvent mettre à jour directement les demandes");
        }
        
        AccreditationRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
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