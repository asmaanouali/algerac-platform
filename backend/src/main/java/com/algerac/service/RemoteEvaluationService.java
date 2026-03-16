package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.RemoteEvaluationRepository;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.EvaluationTeamRepository;
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
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RemoteEvaluationService {

    private final RemoteEvaluationRepository remoteEvalRepository;
    private final RequestRepository requestRepository;
    private final EvaluationTeamRepository teamRepository;
    private final NotificationService notificationService;

    /**
     * Proposer une évaluation à distance
     */
    @Transactional
    public RemoteEvaluation proposeRemoteEvaluation(Long requestId,
            RemoteEvalJustification justification, String justificationDetails,
            String technologyPlatform, String remoteScope, String onsiteScope,
            Boolean partialRemote, LocalDateTime startDate, LocalDateTime endDate,
            Integer durationHours, User currentUser) {

        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

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
                .status(RemoteEvalStatus.PROPOSED)
                .build();

        eval = remoteEvalRepository.save(eval);
        log.info("Évaluation à distance {} proposée pour {}", evalCode, request.getReferenceNumber());
        return eval;
    }

    /**
     * CD approuve ou rejette la demande d'évaluation à distance
     */
    @Transactional
    public RemoteEvaluation cdApproval(Long evalId, boolean approved, String comments,
            User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        if (approved) {
            eval.setStatus(RemoteEvalStatus.CD_APPROVED);
            eval.setApprovedByCd(currentUser);
            eval.setApprovalDate(LocalDateTime.now());
            eval.setApprovalComments(comments);

            // Notifier l'OEC pour obtenir le consentement
            notificationService.createNotification(
                    eval.getRequest().getOec().getId(),
                    "Évaluation à distance proposée",
                    String.format("Une évaluation à distance est proposée pour %s via %s. Votre consentement est requis.",
                            eval.getRequest().getReferenceNumber(), eval.getTechnologyPlatform()),
                    "info"
            );
            eval.setStatus(RemoteEvalStatus.PENDING_OEC_CONSENT);
        } else {
            eval.setStatus(RemoteEvalStatus.CD_REJECTED);
            eval.setApprovalComments(comments);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("Évaluation à distance {} : CD {}", eval.getEvaluationCode(), approved ? "approuvée" : "rejetée");
        return eval;
    }

    /**
     * OEC donne ou refuse son consentement
     */
    @Transactional
    public RemoteEvaluation oecConsent(Long evalId, boolean consented, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        if (consented) {
            eval.setOecConsentObtained(true);
            eval.setOecConsentDate(LocalDateTime.now());
            eval.setStatus(RemoteEvalStatus.OEC_CONSENTED);
        } else {
            eval.setOecConsentObtained(false);
            eval.setStatus(RemoteEvalStatus.OEC_REFUSED);
        }

        eval = remoteEvalRepository.save(eval);
        log.info("OEC {} pour l'évaluation à distance {}", consented ? "a consenti" : "a refusé",
                eval.getEvaluationCode());
        return eval;
    }

    /**
     * Vérification technique et programmation
     */
    @Transactional
    public RemoteEvaluation verifyAndSchedule(Long evalId, Boolean videoOk, Boolean audioOk,
            Boolean docSharingOk, Boolean connectionOk, String techPrereqs, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        eval.setVideoCapabilityVerified(videoOk);
        eval.setAudioCapabilityVerified(audioOk);
        eval.setDocumentSharingVerified(docSharingOk);
        eval.setConnectionStabilityTest(connectionOk);
        eval.setTechnicalPrerequisites(techPrereqs);

        if (Boolean.TRUE.equals(videoOk) && Boolean.TRUE.equals(audioOk) && Boolean.TRUE.equals(connectionOk)) {
            eval.setStatus(RemoteEvalStatus.SCHEDULED);
        } else {
            eval.setStatus(RemoteEvalStatus.TECH_VERIFICATION);
        }

        eval = remoteEvalRepository.save(eval);
        return eval;
    }

    /**
     * Démarrer l'évaluation à distance
     */
    @Transactional
    public RemoteEvaluation startEvaluation(Long evalId, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);
        eval.setStatus(RemoteEvalStatus.IN_PROGRESS);
        eval = remoteEvalRepository.save(eval);
        log.info("Évaluation à distance {} démarrée", eval.getEvaluationCode());
        return eval;
    }

    /**
     * Terminer l'évaluation et enregistrer les résultats
     */
    @Transactional
    public RemoteEvaluation completeEvaluation(Long evalId, String findings,
            Boolean techDifficulties, String techDetails, Boolean onsiteFollowUp,
            String followUpReason, User currentUser) {
        RemoteEvaluation eval = getEvalOrThrow(evalId);

        eval.setEvaluationFindings(findings);
        eval.setTechnicalDifficultiesEncountered(techDifficulties);
        eval.setTechnicalDifficultiesDetails(techDetails);
        eval.setOnsiteFollowUpNeeded(onsiteFollowUp);
        eval.setOnsiteFollowUpReason(followUpReason);

        eval.setStatus(Boolean.TRUE.equals(onsiteFollowUp) ?
                RemoteEvalStatus.ONSITE_FOLLOW_UP : RemoteEvalStatus.COMPLETED);

        eval = remoteEvalRepository.save(eval);
        log.info("Évaluation à distance {} terminée", eval.getEvaluationCode());
        return eval;
    }

    public List<RemoteEvaluation> getByRequest(Long requestId) {
        return remoteEvalRepository.findByRequest_Id(requestId);
    }

    public List<RemoteEvaluation> getActive() {
        return remoteEvalRepository.findByStatusIn(Arrays.asList(
                RemoteEvalStatus.PROPOSED, RemoteEvalStatus.CD_APPROVED,
                RemoteEvalStatus.PENDING_OEC_CONSENT, RemoteEvalStatus.OEC_CONSENTED,
                RemoteEvalStatus.SCHEDULED, RemoteEvalStatus.IN_PROGRESS));
    }

    public List<RemoteEvaluation> getAll() {
        return remoteEvalRepository.findAllByOrderByCreatedAtDesc();
    }

    private RemoteEvaluation getEvalOrThrow(Long id) {
        return remoteEvalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Évaluation à distance non trouvée: " + id));
    }
}
