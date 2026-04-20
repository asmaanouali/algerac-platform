package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.RemoteEvaluationRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * PRO_29 : Service de gestion des évaluations à distance.
 * Implémente le workflow complet selon la procédure PRO 29 Rev02.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RemoteEvaluationService {

    private final RemoteEvaluationRepository remoteEvalRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;

    // ═══════════════════════════════════════════════════════════
    // §5.2 — Création (avec validation des critères d'exclusion)
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation proposeRemoteEvaluation(Long requestId,
            RemoteEvalJustification justification, String justificationDetails,
            String technologyPlatform, String remoteScope, String onsiteScope,
            Boolean partialRemote, LocalDateTime startDate, LocalDateTime endDate,
            Integer durationHours, Integer evaluationPhases, User currentUser) {

        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        // Validation §5 : Non applicable aux évaluations initiales et d'extensions
        validateRequestTypeForRemote(request);

        String evalCode = "REMOTE-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        RemoteEvaluation eval = RemoteEvaluation.builder()
                .request(request)
                .evaluationCode(evalCode)
                .justification(justification)
                .justificationDetails(justificationDetails)
                .technologyPlatform(technologyPlatform)
                .remoteScope(remoteScope)
                .onsiteScope(onsiteScope)
                .partialRemote(partialRemote)
                .scheduledStartDate(startDate)
                .scheduledEndDate(endDate)
                .estimatedDurationHours(durationHours)
                .evaluationPhases(evaluationPhases != null ? evaluationPhases : 1)
                .status(RemoteEvalStatus.RISK_ANALYSIS_PENDING)
                .build();

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Évaluation à distance {} créée pour demande {}",
                evalCode, request.getReferenceNumber());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Analyse des risques (FOR 77-1)
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation submitRiskAnalysis(Long evalId,
            Integer monthsSinceLastOnsite,
            Boolean ictEquipmentAvailable, String ictEquipmentDetails,
            Boolean requirementsNatureSuitable,
            Boolean findingsNatureFollowable, String findingsDetails,
            Boolean complaintsToInvestigate, String complaintsDetails,
            Boolean safetyConstraintsAcceptable,
            Boolean cabResourcesStable,
            Boolean digitizationLevelAdequate,
            Boolean cabPerformanceSatisfactory,
            Boolean teamSizeAdequate,
            Boolean assessorRemoteExperience,
            String comments, User currentUser) {

        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.RISK_ANALYSIS_PENDING);

        eval.setRiskAnalyzedBy(currentUser);
        eval.setRiskAnalysisDate(LocalDateTime.now());
        eval.setRiskAnalysisComments(comments);

        eval.setMonthsSinceLastOnsiteAssessment(monthsSinceLastOnsite);
        eval.setIctEquipmentAvailable(ictEquipmentAvailable);
        eval.setIctEquipmentDetails(ictEquipmentDetails);
        eval.setRequirementsNatureSuitable(requirementsNatureSuitable);
        eval.setFindingsNatureFollowable(findingsNatureFollowable);
        eval.setFindingsDetails(findingsDetails);
        eval.setComplaintsToInvestigate(complaintsToInvestigate);
        eval.setComplaintsDetails(complaintsDetails);
        eval.setSafetyConstraintsAcceptable(safetyConstraintsAcceptable);
        eval.setCabResourcesStable(cabResourcesStable);
        eval.setDigitizationLevelAdequate(digitizationLevelAdequate);
        eval.setCabPerformanceSatisfactory(cabPerformanceSatisfactory);
        eval.setTeamSizeAdequate(teamSizeAdequate);
        eval.setAssessorRemoteExperience(assessorRemoteExperience);

        // Déterminer le résultat : acceptable si tous les critères essentiels sont OK
        boolean acceptable = Boolean.TRUE.equals(ictEquipmentAvailable)
                && Boolean.TRUE.equals(requirementsNatureSuitable)
                && Boolean.TRUE.equals(safetyConstraintsAcceptable)
                && Boolean.TRUE.equals(cabResourcesStable)
                && Boolean.TRUE.equals(digitizationLevelAdequate);

        eval.setRiskAnalysisResult(acceptable ?
                RiskAnalysisResult.ACCEPTABLE : RiskAnalysisResult.NOT_ACCEPTABLE);

        if (acceptable) {
            eval.setStatus(RemoteEvalStatus.RISK_ANALYSIS_COMPLETED);
        } else {
            eval.setStatus(RemoteEvalStatus.RISK_ANALYSIS_REJECTED);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Analyse des risques {} : {}",
                eval.getEvaluationCode(), eval.getRiskAnalysisResult());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Approbation CD
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation cdApproval(Long evalId, boolean approved, String comments,
            User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.RISK_ANALYSIS_COMPLETED);

        if (approved) {
            eval.setStatus(RemoteEvalStatus.CD_APPROVED);
            eval.setApprovedByCd(currentUser);
            eval.setApprovalDate(LocalDateTime.now());
            eval.setApprovalComments(comments);

            // Notifier l'OEC pour obtenir le consentement
            if (eval.getRequest().getOec() != null) {
                notificationService.createNotification(
                        eval.getRequest().getOecId(),
                        "Évaluation à distance proposée — PRO 29",
                        String.format("Une évaluation à distance est proposée pour votre demande %s via %s. " +
                                "Votre consentement est requis.",
                                eval.getRequest().getReferenceNumber(), eval.getTechnologyPlatform()),
                        "info"
                );
            }
            eval.setStatus(RemoteEvalStatus.PENDING_OEC_CONSENT);
        } else {
            eval.setStatus(RemoteEvalStatus.CD_REJECTED);
            eval.setApprovalComments(comments);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — CD {} l'évaluation {}",
                approved ? "approuve" : "rejette", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Consentement OEC
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation oecConsent(Long evalId, boolean consented, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.PENDING_OEC_CONSENT);

        if (consented) {
            eval.setOecConsentObtained(true);
            eval.setOecConsentDate(LocalDateTime.now());
            eval.setStatus(RemoteEvalStatus.OEC_CONSENTED);
        } else {
            eval.setOecConsentObtained(false);
            eval.setStatus(RemoteEvalStatus.OEC_REFUSED);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — OEC {} pour {}",
                consented ? "consenti" : "refusé", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.5 — Vérification technique
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation verifyTechnical(Long evalId, Boolean videoOk, Boolean audioOk,
            Boolean docSharingOk, Boolean connectionOk, String techPrereqs, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.OEC_CONSENTED);

        eval.setVideoCapabilityVerified(videoOk);
        eval.setAudioCapabilityVerified(audioOk);
        eval.setDocumentSharingVerified(docSharingOk);
        eval.setConnectionStabilityTest(connectionOk);
        eval.setTechnicalPrerequisites(techPrereqs);

        boolean allOk = Boolean.TRUE.equals(videoOk) && Boolean.TRUE.equals(audioOk)
                && Boolean.TRUE.equals(connectionOk);

        if (allOk) {
            eval.setStatus(RemoteEvalStatus.TECH_VERIFICATION);
        } else {
            eval.setStatus(RemoteEvalStatus.TECH_VERIFICATION_FAILED);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Vérification technique {} : {}",
                eval.getEvaluationCode(), allOk ? "OK" : "ÉCHOUÉE");
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.3 & §5.4 — Confirmation confidentialité (FOR 01-1) & planification
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation confirmConfidentialityAndSchedule(Long evalId,
            LocalDateTime startDate, LocalDateTime endDate, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.TECH_VERIFICATION);

        eval.setConfidentialityConfirmed(true);
        eval.setConfidentialityConfirmationDate(LocalDateTime.now());
        if (startDate != null) eval.setScheduledStartDate(startDate);
        if (endDate != null) eval.setScheduledEndDate(endDate);
        eval.setStatus(RemoteEvalStatus.SCHEDULED);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — {} programmée, confidentialité confirmée", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-A — Réunion d'ouverture
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation startOpeningMeeting(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.SCHEDULED);

        eval.setOpeningMeetingDate(LocalDateTime.now());
        eval.setStatus(RemoteEvalStatus.OPENING_MEETING);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Réunion d'ouverture {} démarrée", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-B — Démarrer l'évaluation
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation startEvaluation(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.OPENING_MEETING);

        eval.setStatus(RemoteEvalStatus.IN_PROGRESS);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Évaluation {} en cours", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-B — Signaler des difficultés techniques
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation reportDifficulties(Long evalId, String details, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        eval.setTechnicalDifficultiesEncountered(true);
        eval.setTechnicalDifficultiesDetails(details);
        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Difficultés signalées pour {}", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-C — Réunion de clôture
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation closingMeeting(Long evalId, String findings, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.IN_PROGRESS);

        eval.setClosingMeetingDate(LocalDateTime.now());
        eval.setEvaluationFindings(findings);
        // Deadline fiches d'écarts : 24h après la réunion de clôture
        eval.setDeviationSheetsDeadline(LocalDateTime.now().plusHours(24));
        eval.setStatus(RemoteEvalStatus.CLOSING_MEETING);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Réunion de clôture {} terminée", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-C — Envoi des fiches d'écarts
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation sendDeviationSheets(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.CLOSING_MEETING);

        eval.setDeviationSheetsSentDate(LocalDateTime.now());
        // Deadline pour l'OEC : 24h après réception
        eval.setOecDocumentsDeadline(LocalDateTime.now().plusHours(24));
        eval.setStatus(RemoteEvalStatus.PENDING_DEVIATION_SHEETS);

        // Notifier l'OEC
        if (eval.getRequest().getOec() != null) {
            notificationService.createNotification(
                    eval.getRequest().getOecId(),
                    "Fiches d'écarts envoyées — PRO 29",
                    String.format("Les fiches d'écarts de l'évaluation %s ont été envoyées. " +
                            "Veuillez valider les documents dans les 24 heures.",
                            eval.getEvaluationCode()),
                    "warning"
            );
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Fiches d'écarts envoyées pour {}", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-C — Réception des documents validés par l'OEC
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation receiveOecDocuments(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.PENDING_DEVIATION_SHEETS);

        eval.setOecDocumentsReceivedDate(LocalDateTime.now());
        eval.setStatus(RemoteEvalStatus.PENDING_OEC_VALIDATION);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Documents OEC reçus pour {}", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-D & E — Traçabilité documentaire et soumission CAS
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation completeEvaluation(Long evalId, String ictUsageDesc,
            String ictEffectiveness, Boolean onsiteFollowUp, String followUpReason,
            User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        eval.setIctUsageDescription(ictUsageDesc);
        eval.setIctEffectivenessAssessment(ictEffectiveness);
        eval.setOnsiteFollowUpNeeded(onsiteFollowUp);
        eval.setOnsiteFollowUpReason(followUpReason);

        if (Boolean.TRUE.equals(onsiteFollowUp)) {
            eval.setStatus(RemoteEvalStatus.ONSITE_FOLLOW_UP);
        } else {
            eval.setStatus(RemoteEvalStatus.PENDING_CAS_DECISION);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Évaluation {} finalisée → {}",
                eval.getEvaluationCode(), eval.getStatus());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6-E — Décision CAS (PRO 16)
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation recordCasDecision(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        assertStatus(eval, RemoteEvalStatus.PENDING_CAS_DECISION);

        eval.setStatus(RemoteEvalStatus.COMPLETED);
        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Décision CAS enregistrée pour {}", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.7 — Évaluation à distance non réalisable
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation markNotFeasible(Long evalId, String reason,
            Boolean deskReview, Boolean conferenceCall, LocalDateTime onsitePlannedDate,
            User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        eval.setRemoteNotFeasible(true);
        eval.setNotFeasibleReason(reason);
        eval.setDeskReviewConducted(deskReview);
        eval.setConferenceCallConducted(conferenceCall);
        eval.setOnsitePlannedDate(onsitePlannedDate);
        eval.setStatus(RemoteEvalStatus.NOT_FEASIBLE_DESK_REVIEW);

        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Évaluation {} marquée non réalisable, revue documentaire", eval.getEvaluationCode());
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // §5.6 — Annuler / Reporter
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public RemoteEvaluation cancel(Long evalId, String reason, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        eval.setStatus(RemoteEvalStatus.CANCELLED);
        eval.setTechnicalDifficultiesEncountered(true);
        eval.setTechnicalDifficultiesDetails(reason);
        eval = remoteEvalRepository.save(eval);
        log.info("PRO_29 — Évaluation {} annulée : {}", eval.getEvaluationCode(), reason);
        return eval;
    }

    // ═══════════════════════════════════════════════════════════
    // Queries
    // ═══════════════════════════════════════════════════════════

    public RemoteEvaluation getById(Long id) {
        return getEvalOrThrow(id);
    }

    public List<RemoteEvaluation> getByRequest(Long requestId) {
        return remoteEvalRepository.findByRequest_Id(requestId);
    }

    public List<RemoteEvaluation> getActive() {
        return remoteEvalRepository.findByStatusIn(Arrays.asList(
                RemoteEvalStatus.RISK_ANALYSIS_PENDING,
                RemoteEvalStatus.RISK_ANALYSIS_COMPLETED,
                RemoteEvalStatus.PENDING_CD_APPROVAL,
                RemoteEvalStatus.CD_APPROVED,
                RemoteEvalStatus.PENDING_OEC_CONSENT,
                RemoteEvalStatus.OEC_CONSENTED,
                RemoteEvalStatus.TECH_VERIFICATION,
                RemoteEvalStatus.SCHEDULED,
                RemoteEvalStatus.OPENING_MEETING,
                RemoteEvalStatus.IN_PROGRESS,
                RemoteEvalStatus.CLOSING_MEETING,
                RemoteEvalStatus.PENDING_DEVIATION_SHEETS,
                RemoteEvalStatus.PENDING_OEC_VALIDATION,
                RemoteEvalStatus.PENDING_CAS_DECISION));
    }

    public List<RemoteEvaluation> getAll() {
        return remoteEvalRepository.findAllByOrderByCreatedAtDesc();
    }

    // ═══════════════════════════════════════════════════════════
    // Validation helpers
    // ═══════════════════════════════════════════════════════════

    private void validateRequestTypeForRemote(AccreditationRequest request) {
        String type = request.getTypeLowercase();
        if ("initial".equals(type)) {
            throw new RuntimeException(
                    "PRO_29 : L'évaluation à distance n'est pas applicable aux évaluations initiales.");
        }
        if ("extension".equals(type)) {
            throw new RuntimeException(
                    "PRO_29 : L'évaluation à distance n'est pas applicable aux extensions de portée.");
        }
    }

    private void assertStatus(RemoteEvaluation eval, RemoteEvalStatus expected) {
        if (eval.getStatus() != expected) {
            throw new RuntimeException(String.format(
                    "Transition invalide : statut actuel = %s, attendu = %s",
                    eval.getStatus(), expected));
        }
    }

    private RemoteEvaluation getEvalOrThrow(Long id) {
        return remoteEvalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Évaluation à distance non trouvée: " + id));
    }
}
