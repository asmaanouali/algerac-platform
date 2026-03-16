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
import java.util.Random;

/**
 * PRO_31 : Service de gestion du transfert d'accréditation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccreditationTransferService {

    private final AccreditationTransferRepository transferRepository;
    private final RequestRepository requestRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Initier une demande de transfert d'accréditation
     */
    @Transactional
    public AccreditationTransfer initiateTransfer(Long originalRequestId,
            Long sourceOecId, String sourceOrgName, String sourceOrgDetails,
            String targetOrgName, String targetOrgDetails,
            TransferReason reason, String reasonDetails,
            String transferredScope, Boolean fullScope, String scopeMods,
            User currentUser) {

        AccreditationRequest request = requestRepository.findById(originalRequestId)
                .orElseThrow(() -> new RuntimeException("Demande originale non trouvée"));

        User sourceOec = userRepository.findById(sourceOecId)
                .orElseThrow(() -> new RuntimeException("OEC source non trouvé"));

        String transferCode = "TRF-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        AccreditationTransfer transfer = AccreditationTransfer.builder()
                .transferCode(transferCode)
                .originalRequest(request)
                .sourceOec(sourceOec)
                .sourceOrganizationName(sourceOrgName)
                .sourceOrganizationDetails(sourceOrgDetails)
                .targetOrganizationName(targetOrgName)
                .targetOrganizationDetails(targetOrgDetails)
                .reason(reason)
                .reasonDetails(reasonDetails)
                .transferredScope(transferredScope)
                .fullScopeTransfer(fullScope)
                .scopeModifications(scopeMods)
                .status(TransferStatus.INITIATED)
                .build();

        // Chercher le certificat associé
        certificateRepository.findByRequest_Id(originalRequestId).ifPresent(transfer::setOriginalCertificate);

        transfer = transferRepository.save(transfer);
        log.info("Transfert {} initié de {} vers {}", transferCode, sourceOrgName, targetOrgName);
        return transfer;
    }

    /**
     * Soumettre les documents de transfert
     */
    @Transactional
    public AccreditationTransfer submitDocuments(Long transferId, String continuityAssessment,
            Boolean managementContinuity, Boolean personnelContinuity, Boolean equipmentContinuity) {

        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setContinuityAssessment(continuityAssessment);
        transfer.setManagementSystemContinuity(managementContinuity);
        transfer.setPersonnelContinuity(personnelContinuity);
        transfer.setEquipmentContinuity(equipmentContinuity);
        transfer.setStatus(TransferStatus.DOCUMENTS_SUBMITTED);
        transfer = transferRepository.save(transfer);
        log.info("Documents soumis pour le transfert {}", transfer.getTransferCode());
        return transfer;
    }

    /**
     * Examiner la demande de transfert
     */
    @Transactional
    public AccreditationTransfer review(Long transferId, boolean evaluationRequired,
            String findings, User currentUser) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setEvaluationRequired(evaluationRequired);
        transfer.setEvaluationFindings(findings);
        transfer.setStatus(evaluationRequired ? TransferStatus.EVALUATION_REQUIRED : TransferStatus.PENDING_CAS_DECISION);
        transfer = transferRepository.save(transfer);
        log.info("Examen du transfert {} terminé, évaluation {}", transfer.getTransferCode(),
                evaluationRequired ? "requise" : "non requise");
        return transfer;
    }

    /**
     * Enregistrer le résultat de l'évaluation de transfert
     */
    @Transactional
    public AccreditationTransfer recordEvaluationResult(Long transferId, String findings) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setEvaluationFindings(findings);
        transfer.setStatus(TransferStatus.EVALUATION_COMPLETED);
        transfer = transferRepository.save(transfer);
        return transfer;
    }

    /**
     * Décision finale (CAS ou CD/DG)
     */
    @Transactional
    public AccreditationTransfer decide(Long transferId, boolean approved,
            String justification, User currentUser) {

        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setDecisionBy(currentUser);
        transfer.setDecisionDate(LocalDateTime.now());
        transfer.setDecisionJustification(justification);

        if (approved) {
            transfer.setStatus(TransferStatus.APPROVED);
            // Annuler l'ancien certificat
            if (transfer.getOriginalCertificate() != null) {
                transfer.setOriginalCertificateCancellationDate(LocalDateTime.now());
                AccreditationCertificate oldCert = transfer.getOriginalCertificate();
                oldCert.setPublished(false);
                certificateRepository.save(oldCert);
            }
            log.info("Transfert {} approuvé", transfer.getTransferCode());

            // Mettre à jour le statut de la demande
            AccreditationRequest request = transfer.getOriginalRequest();
            request.setCurrentStep("Transfert d'accréditation approuvé - PRO 31");
            request.setNextAction("Émettre le nouveau certificat");
            requestRepository.save(request);
        } else {
            transfer.setStatus(TransferStatus.REJECTED);
            log.info("Transfert {} rejeté", transfer.getTransferCode());
        }

        transfer = transferRepository.save(transfer);
        return transfer;
    }

    /**
     * Émettre le nouveau certificat après transfert
     */
    @Transactional
    public AccreditationTransfer issueCertificate(Long transferId, Long newCertificateId) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        AccreditationCertificate newCert = certificateRepository.findById(newCertificateId)
                .orElseThrow(() -> new RuntimeException("Nouveau certificat non trouvé"));

        transfer.setNewCertificate(newCert);
        transfer.setNewCertificateIssueDate(LocalDateTime.now());
        transfer.setStatus(TransferStatus.CERTIFICATE_ISSUED);
        transfer = transferRepository.save(transfer);
        log.info("Nouveau certificat émis pour le transfert {}", transfer.getTransferCode());
        return transfer;
    }

    /**
     * Compléter le transfert
     */
    @Transactional
    public AccreditationTransfer complete(Long transferId) {
        AccreditationTransfer transfer = getTransferOrThrow(transferId);
        transfer.setStatus(TransferStatus.COMPLETED);
        transfer = transferRepository.save(transfer);
        log.info("Transfert {} complété", transfer.getTransferCode());
        return transfer;
    }

    public List<AccreditationTransfer> getAll() { return transferRepository.findAllByOrderByCreatedAtDesc(); }
    public List<AccreditationTransfer> getBySourceOec(Long oecId) { return transferRepository.findBySourceOec_Id(oecId); }
    public List<AccreditationTransfer> getByStatus(TransferStatus status) { return transferRepository.findByStatus(status); }

    private AccreditationTransfer getTransferOrThrow(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transfert non trouvé: " + id));
    }
}
