package com.algerac.service;

import com.algerac.dto.PaymentDTO;
import com.algerac.model.*;
import com.algerac.repository.PaymentRepository;
import com.algerac.repository.QuotationRepository;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import com.algerac.repository.DocumentaryReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final RequestRepository requestRepository;
    private final QuotationRepository quotationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final DocumentaryReviewRepository docReviewRepository;
    
    /**
     * Créer un paiement en attente de fixation des frais par le DAG.
     * Appelé quand l'OEC soumet sa demande initiale.
     */
    @Transactional
    public Payment createRegistrationFeePayment(Long requestId) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        // Vérifier si un paiement existe déjà
        if (paymentRepository.findByRequest_IdAndPaymentType(requestId, "REGISTRATION_FEE").isPresent()) {
            throw new RuntimeException("Un paiement existe déjà pour cette demande");
        }
        
        Payment payment = Payment.builder()
                .request(request)
                .amount(BigDecimal.ZERO) // Le montant sera fixé par le DAG
                .paymentType("REGISTRATION_FEE")
                .status(PaymentStatus.AWAITING_FEE_SETTING)
                .createdAt(LocalDateTime.now())
                .build();
        
        payment = paymentRepository.save(payment);
        log.info("Paiement créé (en attente de fixation des frais par DAG) pour la demande {}", request.getReferenceNumber());
        
        // Notifier le DAG qu'un nouveau dossier nécessite la fixation des frais
        notifyDAGNewRequestFees(request);
        
        return payment;
    }

    /**
     * Créer le paiement des frais d'analyse documentaire.
     * Appelé quand le RA lance la revue documentaire.
     */
    @Transactional
    public Payment createDocReviewFeePayment(Long requestId) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (paymentRepository.findByRequest_IdAndPaymentType(requestId, "DOC_REVIEW_FEE").isPresent()) {
            throw new RuntimeException("Un paiement de frais d'analyse documentaire existe déjà pour cette demande");
        }
        
        Payment payment = Payment.builder()
                .request(request)
                .amount(BigDecimal.ZERO)
                .paymentType("DOC_REVIEW_FEE")
                .status(PaymentStatus.AWAITING_FEE_SETTING)
                .createdAt(LocalDateTime.now())
                .build();
        
        payment = paymentRepository.save(payment);
        log.info("Paiement frais analyse documentaire créé (en attente fixation frais par DAG) pour la demande {}", request.getReferenceNumber());
        
        // Notify DAG
        notifyDAGDocReviewFees(request);
        
        return payment;
    }

    /**
     * Créer le paiement des frais d'évaluation quand l'OEC valide le devis.
     * Le montant est celui déjà fixé par le DAG lors de l'approbation du devis.
     * Flux standardisé : facture ajoutée, OEC paye, transactionId + preuve.
     */
    @Transactional
    public Payment createEvaluationFeePayment(Long requestId) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        // Vérifier si un paiement d'évaluation existe déjà
        if (paymentRepository.findByRequest_IdAndPaymentType(requestId, "EVALUATION_FEE").isPresent()) {
            throw new RuntimeException("Un paiement d'évaluation existe déjà pour cette demande");
        }
        
        // Récupérer le montant depuis le devis approuvé par le DAG
        java.util.List<Quotation> quotations = quotationRepository.findByRequest_Id(requestId);
        Quotation quotation = quotations.stream()
                .filter(q -> q.getAmount() != null && q.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucun devis avec montant trouvé"));
        
        Payment payment = Payment.builder()
                .request(request)
                .amount(quotation.getAmount()) // Montant fixé par le DAG lors de l'approbation du devis
                .paymentType("EVALUATION_FEE")
                .status(PaymentStatus.PENDING) // Directement en attente de paiement (montant déjà fixé)
                .feeSetDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        
        payment = paymentRepository.save(payment);
        log.info("Paiement des frais d'évaluation créé ({} DA) pour la demande {}", 
                quotation.getAmount(), request.getReferenceNumber());
        
        // Notifier l'OEC qu'il doit payer les frais d'évaluation
        notifyOECPaymentRequired(request, quotation.getAmount());
        
        // Notifier le DAG pour suivi
        notifyDAGEvaluationFeeCreated(request, quotation.getAmount());
        
        return payment;
    }
    
    /**
     * DAG: Fixer les frais d'enregistrement du dossier.
     */
    @Transactional
    public Payment setRegistrationFee(Long paymentId, BigDecimal amount, Long dagUserId) {
        // Vérifier que l'utilisateur est bien DAG
        User dagUser = userRepository.findById(dagUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur DAG non trouvé"));
        if (dagUser.getRole() != UserRole.DAG) {
            throw new RuntimeException("Seul le DAG peut fixer les frais d'enregistrement");
        }
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() != PaymentStatus.AWAITING_FEE_SETTING) {
            throw new RuntimeException("Les frais ont déjà été fixés pour ce paiement");
        }
        
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Le montant doit être positif");
        }
        
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setFeeSetDate(LocalDateTime.now());
        payment.setFeeSetById(dagUserId);
        
        payment = paymentRepository.save(payment);
        
        // Mettre à jour le statut de la demande selon le type de paiement
        AccreditationRequest request = payment.getRequest();
        if ("DOC_REVIEW_FEE".equals(payment.getPaymentType())) {
            request.setStatus(RequestStatus.DOC_REVIEW_FEE_PENDING_PAYMENT);
            request.setNextAction("OEC doit payer les frais d'analyse documentaire");
            request.setPendingWith("OEC");
            // Update documentary review status
            docReviewRepository.findFirstByRequest_IdOrderByCreatedAtDesc(request.getId())
                    .ifPresent(review -> {
                        review.setStatus(DocumentaryReviewStatus.FEE_SET);
                        docReviewRepository.save(review);
                    });
        } else {
            request.setStatus(RequestStatus.PENDING_PAYMENT);
            request.setNextAction("OEC doit payer les frais d'enregistrement");
            request.setPendingWith("OEC");
        }
        requestRepository.save(request);
        
        log.info("Frais d'enregistrement fixés à {} DA pour la demande {} par DAG {}", 
                amount, request.getReferenceNumber(), dagUserId);
        
        // Notifier l'OEC qu'il doit se connecter pour payer
        notifyOECPaymentRequired(request, amount);
        
        return payment;
    }
    
    /**
     * OEC: Soumettre la preuve de paiement (transaction ID + document).
     * Flux standardisé pour tous les types de paiement.
     */
    @Transactional
    public Payment submitPaymentProof(Long paymentId, String transactionId, String proofBase64, String proofName, String proofMimeType) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.DAG_REJECTED) {
            throw new RuntimeException("Ce paiement n'est pas en attente de preuve");
        }
        
        payment.setTransactionId(transactionId);
        payment.setProofDocumentBase64(proofBase64);
        payment.setProofDocumentName(proofName);
        payment.setProofDocumentMimeType(proofMimeType);
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setPaymentDate(LocalDateTime.now());
        payment.setStatus(PaymentStatus.PROOF_SUBMITTED);
        
        payment = paymentRepository.save(payment);
        
        AccreditationRequest request = payment.getRequest();
        
        // Progression selon le type de paiement
        if ("DOC_REVIEW_FEE".equals(payment.getPaymentType())) {
            // Frais d'analyse documentaire payés → en attente validation DAG
            request.setStatus(RequestStatus.DOC_REVIEW_PAYMENT_SUBMITTED);
            request.setNextAction("DAG doit valider le paiement des frais d'analyse documentaire");
            request.setPendingWith("DAG");
            requestRepository.save(request);
            
            // Update documentary review status
            docReviewRepository.findFirstByRequest_IdOrderByCreatedAtDesc(request.getId())
                    .ifPresent(review -> {
                        review.setStatus(DocumentaryReviewStatus.PAYMENT_SUBMITTED);
                        docReviewRepository.save(review);
                    });
            
            log.info("Preuve de paiement (frais analyse documentaire) soumise pour {} - Transaction: {}.",
                    request.getReferenceNumber(), transactionId);
        } else if ("EVALUATION_FEE".equals(payment.getPaymentType())) {
            // Frais d'évaluation payés → constitution de l'équipe d'évaluation
            request.setStatus(RequestStatus.QUOTATION_VALIDATED);
            request.setNextAction("Constitution de l'équipe d'évaluation");
            request.setPendingWith("RA");
            request.setCurrentPhase("CONSTITUTION_EQUIPE");
            request.setCurrentStep("team_designation");
            request.setProgress(90);
            requestRepository.save(request);
            
            log.info("Preuve de paiement (frais évaluation) soumise pour {} - Transaction: {}. Dossier passe à la constitution d'équipe.", 
                    request.getReferenceNumber(), transactionId);
            
            // Notifier le RA qu'il peut constituer l'équipe
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Frais d'évaluation payés",
                    "L'OEC a payé les frais d'évaluation pour " + request.getReferenceNumber() 
                        + ". Vous pouvez constituer l'équipe d'évaluation.",
                    "ACTION_REQUIRED"
                );
            }
        } else {
            // Frais d'enregistrement payés → dossier va au CD pour assignation
            request.setStatus(RequestStatus.PAYMENT_COMPLETED);
            request.setNextAction("CD doit assigner le dossier à un RA");
            request.setPendingWith("CD");
            requestRepository.save(request);
            
            log.info("Preuve de paiement (frais enregistrement) soumise pour {} - Transaction: {}. Dossier envoyé au CD.", 
                    request.getReferenceNumber(), transactionId);
            
            // Notifier le CD qu'une nouvelle demande est prête pour attribution
            notificationService.notifyChefDepartmentNewRequest(request);
        }
        
        // Notifier aussi le DAG pour qu'il vérifie la preuve de paiement en parallèle
        notifyDAGPaymentProofSubmitted(request, transactionId);
        
        return payment;
    }
    
    /**
     * DAG: Valider le paiement après vérification de la preuve.
     * Le dossier est ensuite envoyé au CD pour assignation.
     */
    @Transactional
    public Payment validatePaymentByDAG(Long paymentId, Long dagUserId, String comments) {
        // Vérifier que l'utilisateur est bien DAG
        User dagUser = userRepository.findById(dagUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur DAG non trouvé"));
        if (dagUser.getRole() != UserRole.DAG) {
            throw new RuntimeException("Seul le DAG peut valider les paiements");
        }
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() != PaymentStatus.PROOF_SUBMITTED) {
            throw new RuntimeException("Ce paiement n'a pas de preuve soumise");
        }
        
        payment.setStatus(PaymentStatus.DAG_VALIDATED);
        payment.setDagValidated(true);
        payment.setDagValidatedDate(LocalDateTime.now());
        payment.setDagValidatedById(dagUserId);
        payment.setDagComments(comments);
        
        payment = paymentRepository.save(payment);
        
        // Spécial DOC_REVIEW_FEE: la validation DAG déclenche la possibilité pour le RA de transmettre les docs
        if ("DOC_REVIEW_FEE".equals(payment.getPaymentType())) {
            AccreditationRequest request = payment.getRequest();
            request.setStatus(RequestStatus.DOC_REVIEW_PAYMENT_VALIDATED);
            request.setNextAction("RA peut transmettre les documents à l'équipe d'évaluation");
            request.setPendingWith("RA");
            requestRepository.save(request);
            
            // Update documentary review status
            docReviewRepository.findFirstByRequest_IdOrderByCreatedAtDesc(request.getId())
                    .ifPresent(review -> {
                        review.setStatus(DocumentaryReviewStatus.PAYMENT_VALIDATED);
                        docReviewRepository.save(review);
                    });
            
            // Notify RA that payment is validated and they can send docs
            if (request.getAssignedToRa() != null) {
                notificationService.createNotification(
                    request.getAssignedToRa().getId(),
                    "Paiement validé - Transmettez les documents",
                    "Le DAG a validé le paiement des frais d'analyse documentaire pour " + request.getReferenceNumber()
                        + ". Vous pouvez maintenant transmettre les documents de l'OEC à l'équipe d'évaluation.",
                    "ACTION_REQUIRED"
                );
            }
            
            log.info("Paiement frais analyse documentaire validé par DAG {} pour {} - RA peut transmettre docs",
                    dagUserId, request.getReferenceNumber());
        } else {
            // Le DAG valide le paiement en parallèle. Le dossier est déjà chez le CD/RA.
            // On ne change PAS le statut de la demande ici.
            log.info("Paiement validé par le DAG {} pour la demande {} - Transaction: {}", 
                    dagUserId, payment.getRequest().getReferenceNumber(), payment.getTransactionId());
        }
        
        return payment;
    }
    
    /**
     * DAG: Rejeter le paiement (preuve non valide).
     */
    @Transactional
    public Payment rejectPaymentByDAG(Long paymentId, Long dagUserId, String comments) {
        // Vérifier que l'utilisateur est bien DAG
        User dagUser = userRepository.findById(dagUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur DAG non trouvé"));
        if (dagUser.getRole() != UserRole.DAG) {
            throw new RuntimeException("Seul le DAG peut rejeter les paiements");
        }
        
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() != PaymentStatus.PROOF_SUBMITTED) {
            throw new RuntimeException("Ce paiement n'a pas de preuve soumise");
        }
        
        payment.setStatus(PaymentStatus.DAG_REJECTED);
        payment.setDagValidated(false);
        payment.setDagValidatedDate(LocalDateTime.now());
        payment.setDagValidatedById(dagUserId);
        payment.setDagComments(comments);
        
        payment = paymentRepository.save(payment);
        
        // Le DAG rejette la preuve mais le dossier continue son cours chez le RA.
        // On ne change PAS le statut de la demande.
        AccreditationRequest request = payment.getRequest();
        log.info("Paiement rejeté par le DAG {} pour la demande {} - Raison: {}", 
                dagUserId, request.getReferenceNumber(), comments);
        
        // Notifier l'OEC que la preuve a été rejetée (il doit resoumettre)
        notifyOECPaymentRejected(request, comments);
        
        return payment;
    }
    
    /**
     * @deprecated Utilisez submitPaymentProof() + validatePaymentByDAG() à la place.
     * Gardé pour compatibilité uniquement - ne pas utiliser dans les nouveaux développements.
     */
    @Deprecated
    @Transactional
    public Payment processPayment(Long paymentId, String paymentMethod, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() == PaymentStatus.COMPLETED || payment.getStatus() == PaymentStatus.DAG_VALIDATED) {
            throw new RuntimeException("Ce paiement a déjà été traité");
        }
        
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentMethod(paymentMethod);
        payment.setTransactionId(transactionId);
        payment.setPaymentDate(LocalDateTime.now());
        
        payment = paymentRepository.save(payment);
        
        // Mettre à jour le statut de la demande
        AccreditationRequest request = payment.getRequest();
        request.setStatus(RequestStatus.PAYMENT_COMPLETED);
        requestRepository.save(request);
        
        log.info("Paiement effectué pour la demande {} - Transaction: {}", 
                request.getReferenceNumber(), transactionId);
        
        // Notifier le CD qu'une nouvelle demande est prête pour attribution
        notificationService.notifyChefDepartmentNewRequest(request);
        
        return payment;
    }
    
    /**
     * Récupérer tous les paiements (pour le DAG)
     */
    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les paiements en attente de fixation des frais
     */
    public List<PaymentDTO> getPaymentsAwaitingFees() {
        return paymentRepository.findByStatus(PaymentStatus.AWAITING_FEE_SETTING)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Récupérer les paiements en attente de validation du DAG
     */
    public List<PaymentDTO> getPaymentsAwaitingValidation() {
        return paymentRepository.findByStatus(PaymentStatus.PROOF_SUBMITTED)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<PaymentDTO> getPaymentsByRequest(Long requestId) {
        return paymentRepository.findByRequest_Id(requestId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
    }
    
    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .requestId(payment.getRequestId())
                .requestReferenceNumber(payment.getRequest().getReferenceNumber())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType())
                .status(payment.getStatus().name())
                .transactionId(payment.getTransactionId())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .proofDocumentName(payment.getProofDocumentName())
                .dagValidated(payment.getDagValidated())
                .dagComments(payment.getDagComments())
                .dagValidatedDate(payment.getDagValidatedDate())
                .oecName(payment.getRequest().getOecOrganizationName())
                .oecEmail(payment.getRequest().getOecEmail())
                .requestRef(payment.getRequest().getReferenceNumber())
                .build();
    }
    
    // ── Notification helpers ──────────────────────────────────────────────
    
    private void notifyDAGNewRequestFees(AccreditationRequest request) {
        List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
        for (User dag : dagUsers) {
            notificationService.createNotification(
                dag.getId(),
                "Nouveau dossier - Frais à fixer",
                "Le dossier " + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId()) 
                    + " de l'organisme " + request.getOecOrganizationName() 
                    + " nécessite la fixation des frais d'enregistrement.",
                "ACTION_REQUIRED"
            );
        }
    }
    
    private void notifyOECPaymentRequired(AccreditationRequest request, BigDecimal amount) {
        notificationService.createNotification(
            request.getOec().getId(),
            "Frais d'enregistrement fixés",
            "Les frais d'enregistrement de votre dossier " 
                + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId())
                + " ont été fixés à " + amount.toPlainString() + " DA. "
                + "Veuillez vous connecter à la plateforme pour effectuer le paiement depuis votre page de facturation.",
            "ACTION_REQUIRED"
        );
    }
    
    private void notifyDAGPaymentProofSubmitted(AccreditationRequest request, String transactionId) {
        List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
        for (User dag : dagUsers) {
            notificationService.createNotification(
                dag.getId(),
                "Preuve de paiement reçue",
                "L'organisme " + request.getOecOrganizationName() 
                    + " a soumis une preuve de paiement (Transaction: " + transactionId 
                    + ") pour le dossier " + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId())
                    + ". Veuillez vérifier et valider.",
                "ACTION_REQUIRED"
            );
        }
    }
    
    private void notifyOECPaymentRejected(AccreditationRequest request, String reason) {
        notificationService.createNotification(
            request.getOec().getId(),
            "Preuve de paiement rejetée",
            "La preuve de paiement pour votre dossier " 
                + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId())
                + " a été rejetée. Raison: " + reason
                + ". Veuillez soumettre une nouvelle preuve de paiement.",
            "WARNING"
        );
    }
    
    private void notifyDAGDocReviewFees(AccreditationRequest request) {
        List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
        for (User dag : dagUsers) {
            notificationService.createNotification(
                dag.getId(),
                "Frais d'analyse documentaire à fixer",
                "Le RA a lancé la revue documentaire pour le dossier " 
                    + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId())
                    + " de l'organisme " + request.getOecOrganizationName()
                    + ". Veuillez fixer les frais d'analyse documentaire.",
                "ACTION_REQUIRED"
            );
        }
    }

    private void notifyDAGEvaluationFeeCreated(AccreditationRequest request, BigDecimal amount) {
        List<User> dagUsers = userRepository.findByRole(UserRole.DAG);
        for (User dag : dagUsers) {
            notificationService.createNotification(
                dag.getId(),
                "Frais d'évaluation - Paiement attendu",
                "Le dossier " + (request.getReferenceNumber() != null ? request.getReferenceNumber() : "#" + request.getId()) 
                    + " (" + request.getOecOrganizationName() + ") - Le devis a été validé par l'OEC. "
                    + "Frais d'évaluation de " + amount.toPlainString() + " DA en attente de paiement.",
                "INFO"
            );
        }
    }
}
