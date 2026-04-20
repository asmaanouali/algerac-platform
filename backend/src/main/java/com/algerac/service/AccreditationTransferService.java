package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.AccreditationTransferRepository;
import com.algerac.repository.AccreditationCertificateRepository;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * PRO_31 : Service de gestion du transfert d'accréditation.
 * Seule une accréditation en cours de validité peut être transférée.
 * Workflow: INITIATED → DOCUMENTS_SUBMITTED → UNDER_REVIEW → [EVALUATION_REQUIRED → EVALUATION_COMPLETED] → PENDING_CAS_DECISION → APPROVED/REJECTED → CERTIFICATE_ISSUED → COMPLETED
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccreditationTransferService {

    private final AccreditationTransferRepository transferRepository;
    private final RequestRepository requestRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final UserRepository userRepository;

    private static final AtomicLong transferSequence = new AtomicLong(System.currentTimeMillis() % 10000);

    /**
     * Initier une demande de transfert d'accréditation (PRO 31 §5)
     * Seule une accréditation en cours de validité peut être transférée.
     */
    @Transactional
    public AccreditationTransfer initiateTransfer(Long originalRequestId,
            Long sourceOecId, String sourceOrgName, String sourceOrgDetails,
            String targetOrgName, String targetOrgDetails, Boolean targetIsNewEntity,
            TransferReason reason, String reasonDetails,
            String transferredScope, Boolean fullScope, String scopeMods,
            String riskAnalysis, Boolean impartialityCompliance,
            Boolean assessmentMethodsContinuity, String lastEvaluationStatus,
            Boolean financialRegularized,
            User currentUser) {

        AccreditationRequest request = requestRepository.findById(originalRequestId)
                .orElseThrow(() -> new RuntimeException("Demande originale non trouvée"));

        // Vérifier que l'accréditation est en cours de validité (ACTIVE ou CERTIFICATE_ISSUED)
        RequestStatus reqStatus = request.getStatus();
        if (reqStatus != RequestStatus.ACTIVE && reqStatus != RequestStatus.CERTIFICATE_ISSUED) {
            throw new RuntimeException("Seule une accréditation en cours de validité peut être transférée. Statut actuel: " + reqStatus);
        }

        User sourceOec = userRepository.findById(sourceOecId)
                .orElseThrow(() -> new RuntimeException("OEC source non trouvé"));

        String transferCode = "TRF-" + Year.now().getValue() + "-"
                + String.format("%04d", transferSequence.incrementAndGet() % 10000);

        // Chercher le certificat associé
        AccreditationCertificate cert = certificateRepository.findByRequest_Id(originalRequestId).orElse(null);

        AccreditationTransfer transfer = AccreditationTransfer.builder()
                .transferCode(transferCode)
                .originalRequest(request)
                .originalCertificate(cert)
                .sourceOec(sourceOec)
                .sourceOrganizationName(sourceOrgName)
                .sourceOrganizationDetails(sourceOrgDetails)
                .targetOrganizationName(targetOrgName)
                .targetOrganizationDetails(targetOrgDetails)
                .targetIsNewEntity(targetIsNewEntity)
                .reason(reason)
                .reasonDetails(reasonDetails)
                .transferredScope(transferredScope)
                .fullScopeTransfer(fullScope)
                .scopeModifications(scopeMods)
                .riskAnalysis(riskAnalysis)
                .impartialityCompliance(impartialityCompliance)
                .assessmentMethodsContinuity(assessmentMethodsContinuity)
                .lastEvaluationStatus(lastEvaluationStatus)
                .financialRegularized(financialRegularized)
                .status(TransferStatus.INITIATED)
                // Conserver la date de fin de validité du certificat original
                .originalExpirationDate(cert != null ? cert.getExpirationDate() : null)
                .accreditationNumber(cert != null ? cert.getCertificateNumber() : null)
                .build();

        transfer = transferRepository.save(transfer);

        // Mettre à jour le statut de la demande originale
        request.setStatus(RequestStatus.TRANSFER_INITIATED);
        request.setCurrentStep("Transfert d'accréditation demandé - PRO 31");
        request.setNextAction("Soumettre les documents de continuité");
        requestRepository.save(request);

        log.info("Transfert {} initié de {} vers {} (motif: {})", transferCode, sourceOrgName, targetOrgName, reason);
        return transfer;
    }

    /**
     * Soumettre les documents de continuité et l'analyse des risques (PRO 31 §5)
     */
    @Transactional
    public AccreditationTransfer submitDocuments(Long transferId, String continuityAssessment,
            Boolean managementContinuity, Boolean personnelContinuity, Boolean equipmentContinuity,
            String attachedDocuments) {

        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        validateStatusTransition(transfer.getStatus(), TransferStatus.DOCUMENTS_SUBMITTED);

        transfer.setContinuityAssessment(continuityAssessment);
        transfer.setManagementSystemContinuity(managementContinuity);
        transfer.setPersonnelContinuity(personnelContinuity);
        transfer.setEquipmentContinuity(equipmentContinuity);
        if (attachedDocuments != null) transfer.setAttachedDocuments(attachedDocuments);
        transfer.setStatus(TransferStatus.DOCUMENTS_SUBMITTED);
        transfer = transferRepository.save(transfer);
        log.info("Documents soumis pour le transfert {}", transfer.getTransferCode());
        return transfer;
    }

    /**
     * Étude de faisabilité du transfert (FOR 86, PRO 31 §5.2)
     * Effectuée par le CD sur la base d'une évaluation documentaire.
     */
    @Transactional
    public AccreditationTransfer conductFeasibilityStudy(Long transferId,
            String feasibilityStudy, String feasibilityStudyRef,
            boolean evaluationRequired, String findings, User currentUser) {

        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        validateStatusTransition(transfer.getStatus(), TransferStatus.UNDER_REVIEW);

        transfer.setFeasibilityStudy(feasibilityStudy);
        transfer.setFeasibilityStudyRef(feasibilityStudyRef != null ? feasibilityStudyRef : "FOR-86");
        transfer.setEvaluationRequired(evaluationRequired);
        transfer.setEvaluationFindings(findings);

        if (evaluationRequired) {
            transfer.setStatus(TransferStatus.EVALUATION_REQUIRED);
        } else {
            transfer.setStatus(TransferStatus.PENDING_CAS_DECISION);
        }

        transfer = transferRepository.save(transfer);

        // Mettre à jour la demande originale
        AccreditationRequest request = transfer.getOriginalRequest();
        request.setStatus(RequestStatus.TRANSFER_REVIEW);
        request.setCurrentStep("Étude de faisabilité du transfert - FOR 86");
        request.setNextAction(evaluationRequired ? "Évaluation supplémentaire requise" : "En attente de décision CAS");
        requestRepository.save(request);

        log.info("Étude de faisabilité pour le transfert {} terminée, évaluation {}",
                transfer.getTransferCode(), evaluationRequired ? "requise" : "non requise");
        return transfer;
    }

    /**
     * Examiner la demande de transfert (compatibilité ascendante)
     */
    @Transactional
    public AccreditationTransfer review(Long transferId, boolean evaluationRequired,
            String findings, User currentUser) {
        return conductFeasibilityStudy(transferId, findings, null, evaluationRequired, findings, currentUser);
    }

    /**
     * Enregistrer le résultat de l'évaluation supplémentaire (PRO 31 §5.2)
     */
    @Transactional
    public AccreditationTransfer recordEvaluationResult(Long transferId, String findings) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        if (transfer.getStatus() != TransferStatus.EVALUATION_REQUIRED
                && transfer.getStatus() != TransferStatus.EVALUATION_IN_PROGRESS) {
            throw new RuntimeException("Ce transfert n'est pas en attente d'évaluation");
        }

        transfer.setEvaluationFindings(findings);
        transfer.setStatus(TransferStatus.PENDING_CAS_DECISION);
        transfer = transferRepository.save(transfer);
        log.info("Évaluation enregistrée pour le transfert {}", transfer.getTransferCode());
        return transfer;
    }

    /**
     * Décision CAS (PRO 31 §5.3, conformément à PRO 16)
     * Avis favorable : OEC notifié, certificat mis à jour, même numéro, date de fin inchangée.
     * Avis défavorable : le demandeur est traité comme nouveau client.
     */
    @Transactional
    public AccreditationTransfer decide(Long transferId, boolean approved,
            String justification, User currentUser) {

        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        if (transfer.getStatus() != TransferStatus.PENDING_CAS_DECISION
                && transfer.getStatus() != TransferStatus.EVALUATION_COMPLETED) {
            throw new RuntimeException("Ce transfert n'est pas en attente de décision");
        }

        transfer.setDecisionBy(currentUser);
        transfer.setDecisionDate(LocalDateTime.now());
        transfer.setDecisionJustification(justification);

        if (approved) {
            transfer.setStatus(TransferStatus.APPROVED);
            // Date de prise d'effet = date de la décision CAS (PRO 31 §5.3)
            transfer.setEffectiveDate(LocalDateTime.now());

            // Annuler l'ancien certificat
            if (transfer.getOriginalCertificate() != null) {
                transfer.setOriginalCertificateCancellationDate(LocalDateTime.now());
                AccreditationCertificate oldCert = transfer.getOriginalCertificate();
                oldCert.setPublished(false);
                certificateRepository.save(oldCert);
            }

            // Mettre à jour la demande
            AccreditationRequest request = transfer.getOriginalRequest();
            request.setCurrentStep("Transfert d'accréditation approuvé - PRO 31");
            request.setNextAction("Émettre le certificat au nom du bénéficiaire du transfert");
            request.setCasDecisionDate(LocalDateTime.now());
            requestRepository.save(request);

            log.info("Transfert {} approuvé par CAS, prise d'effet immédiate", transfer.getTransferCode());
        } else {
            transfer.setStatus(TransferStatus.REJECTED);

            // PRO 31 §5.3 : en cas d'avis défavorable, le demandeur est traité comme nouveau client
            AccreditationRequest request = transfer.getOriginalRequest();
            request.setCurrentStep("Transfert rejeté par le CAS - PRO 31");
            request.setNextAction("Le demandeur est traité comme nouveau client");
            requestRepository.save(request);

            log.info("Transfert {} rejeté par CAS", transfer.getTransferCode());
        }

        transfer = transferRepository.save(transfer);
        return transfer;
    }

    /**
     * Émettre le nouveau certificat après transfert (PRO 31 §5.3)
     * Le certificat porte le nom du bénéficiaire, même numéro, même date de fin de validité.
     */
    @Transactional
    public AccreditationTransfer issueCertificate(Long transferId, Long newCertificateId) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        if (transfer.getStatus() != TransferStatus.APPROVED) {
            throw new RuntimeException("Le transfert doit être approuvé avant l'émission du certificat");
        }

        AccreditationCertificate newCert = certificateRepository.findById(newCertificateId)
                .orElseThrow(() -> new RuntimeException("Nouveau certificat non trouvé"));

        transfer.setNewCertificate(newCert);
        transfer.setNewCertificateIssueDate(LocalDateTime.now());
        transfer.setStatus(TransferStatus.CERTIFICATE_ISSUED);
        transfer = transferRepository.save(transfer);

        // Mettre à jour la demande
        AccreditationRequest request = transfer.getOriginalRequest();
        request.setStatus(RequestStatus.TRANSFER_COMPLETED);
        request.setCurrentStep("Certificat émis au nom du bénéficiaire - PRO 31");
        request.setNextAction("Transfert complété");
        requestRepository.save(request);

        log.info("Certificat émis pour le transfert {} au nom de {}", transfer.getTransferCode(), transfer.getTargetOrganizationName());
        return transfer;
    }

    /**
     * Compléter le transfert (signature convention, publication sur le site web)
     */
    @Transactional
    public AccreditationTransfer complete(Long transferId) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        if (transfer.getStatus() != TransferStatus.CERTIFICATE_ISSUED && transfer.getStatus() != TransferStatus.APPROVED) {
            throw new RuntimeException("Le transfert doit avoir un certificat émis ou être approuvé pour être complété");
        }
        transfer.setStatus(TransferStatus.COMPLETED);
        transfer = transferRepository.save(transfer);

        AccreditationRequest request = transfer.getOriginalRequest();
        request.setStatus(RequestStatus.TRANSFER_COMPLETED);
        request.setCurrentStep("Transfert d'accréditation complété - PRO 31");
        request.setNextAction("Publication du statut sur le site web d'ALGERAC");
        requestRepository.save(request);

        log.info("Transfert {} complété", transfer.getTransferCode());
        return transfer;
    }

    /**
     * Mettre à jour le plan de surveillance (FOR 66, PRO 31 §5.3)
     */
    @Transactional
    public AccreditationTransfer updateSurveillancePlan(Long transferId, String surveillancePlanRef) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setSurveillancePlanRef(surveillancePlanRef);
        return transferRepository.save(transfer);
    }

    public List<AccreditationTransfer> getAll() {
        return transferRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AccreditationTransfer> getBySourceOec(Long oecId) {
        return transferRepository.findBySourceOec_Id(oecId);
    }

    public List<AccreditationTransfer> getByStatus(TransferStatus status) {
        return transferRepository.findByStatus(status);
    }

    public AccreditationTransfer getById(Long id) {
        return getTransferOrThrow(id);
    }

    private AccreditationTransfer getTransferOrThrow(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transfert non trouvé: " + id));
    }

    private void validateStatusTransition(TransferStatus current, TransferStatus target) {
        boolean valid = switch (target) {
            case DOCUMENTS_SUBMITTED -> current == TransferStatus.INITIATED;
            case UNDER_REVIEW -> current == TransferStatus.DOCUMENTS_SUBMITTED;
            case EVALUATION_REQUIRED -> current == TransferStatus.UNDER_REVIEW || current == TransferStatus.DOCUMENTS_SUBMITTED;
            case EVALUATION_COMPLETED -> current == TransferStatus.EVALUATION_REQUIRED || current == TransferStatus.EVALUATION_IN_PROGRESS;
            case PENDING_CAS_DECISION -> current == TransferStatus.UNDER_REVIEW || current == TransferStatus.EVALUATION_COMPLETED
                    || current == TransferStatus.DOCUMENTS_SUBMITTED;
            case APPROVED, REJECTED -> current == TransferStatus.PENDING_CAS_DECISION || current == TransferStatus.EVALUATION_COMPLETED;
            case CERTIFICATE_ISSUED -> current == TransferStatus.APPROVED;
            case COMPLETED -> current == TransferStatus.CERTIFICATE_ISSUED || current == TransferStatus.APPROVED;
            case CANCELLED -> true;
            default -> false;
        };
        if (!valid) {
            throw new RuntimeException("Transition de statut invalide: " + current + " → " + target);
        }
    }
}
