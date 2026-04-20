package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.security.SecureRandom;

/**
 * Service gérant la Phase IV : Surveillance Périodique (PRO 25)
 * Couvre les étapes 13, 14 et 15 du processus d'accréditation PRO 12
 *
 * Cycle d'accréditation (§5.1):
 *   - 1er cycle: 3 ans, 2 surveillances annuelles
 *   - 2ème cycle+: 4 ans, 3 surveillances annuelles
 *
 * Délais max surveillance:
 *   - S1: 14 mois après octroi
 *   - S2: 24 mois (1er cycle) / 26 mois (2ème+)
 *   - S3 (2ème+ uniquement): 36 mois
 *
 * Écarts (§5.2.1.1):
 *   - Non critique: 3 mois max
 *   - Critique: 2,5 mois max
 *
 * Extension (§5.2.2): traitée comme initiale, écarts 6 mois
 * Renouvellement (§5.2.3): annexe 2 - 3 cas de gestion des délais
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class SurveillanceService {

    private final RequestRepository requestRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final SurveillancePlanRepository surveillancePlanRepository;
    private final SurveillanceEvaluationRepository survEvalRepository;
    private final RiskAnalysisFormRepository riskAnalysisRepository;
    private final EvaluationTeamRepository teamRepository;
    private final CASDecisionRepository casDecisionRepository;
    private final CASMeetingRepository casMeetingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // PRO 25 §5.2.1.1 - Délais de traitement des écarts
    private static final int NON_CRITICAL_FINDING_DEADLINE_MONTHS = 3;
    private static final double CRITICAL_FINDING_DEADLINE_MONTHS = 2.5;
    private static final int EXTENSION_FINDING_DEADLINE_MONTHS = 6;

    // PRO 25 §5.1 - Délais max de surveillance
    private static final int FIRST_SURVEILLANCE_MAX_MONTHS = 14;
    private static final int SECOND_SURVEILLANCE_CYCLE1_MAX_MONTHS = 24;
    private static final int SECOND_SURVEILLANCE_CYCLE2_MAX_MONTHS = 26;
    private static final int THIRD_SURVEILLANCE_MAX_MONTHS = 36;

    // PRO 25 Annex 2 - Prolongation max pour renouvellement
    private static final int RENEWAL_EXTENSION_MAX_MONTHS = 3;

    // ========== ÉTAPE 13 : PROGRAMMATION SURVEILLANCE ==========

    /**
     * 13.1 RA programme la surveillance (basée sur FOR 66)
     */
    @Transactional
    public SurveillanceEvaluation programmeSurveillance(Long certificateId, Long requestId,
            LocalDateTime plannedDate, String scope, User currentUser) {
        if (currentUser.getRole() != UserRole.RA && currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls RA/CD peuvent programmer la surveillance");
        }
        
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String evalCode = "SURV-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        SurveillanceEvaluation survEval = SurveillanceEvaluation.builder()
            .certificate(certificate)
            .request(request)
            .evaluationCode(evalCode)
            .evaluationDate(plannedDate)
            .focusScope(scope)
            .status(SurveillanceEvaluationStatus.PLANNED)
            .build();

        survEval = survEvalRepository.save(survEval);

        request.setStatus(RequestStatus.SURVEILLANCE_SCHEDULED);
        request.setCurrentPhase("Phase IV : Surveillance Périodique");
        request.setCurrentStep("Surveillance programmée");
        request.setNextAction("RA effectue l'analyse de risques (FOR 77-1)");
        request.setPendingWith("RA");
        requestRepository.save(request);

        log.info("Surveillance {} programmée pour certificat {}", evalCode, certificate.getCertificateNumber());
        return survEval;
    }

    /**
     * 13.2 RA réalise l'analyse de risques (FOR 77-1)
     */
    @Transactional
    public RiskAnalysisForm createRiskAnalysis(Long survEvalId,
            Boolean previousNonConformities, String previousNCDetails,
            Boolean complaintsTreated, String complaintsDetails,
            Boolean scopeChanges, String scopeChangeDetails,
            Boolean organizationalChanges, String orgChangeDetails,
            Boolean regulatoryChanges, String regChangeDetails,
            Boolean satisfactionIssues, String satisfactionDetails,
            String overallRiskLevel, String recommendedActions,
            User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        String formCode = "FOR77-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        RiskAnalysisForm form = RiskAnalysisForm.builder()
            .request(survEval.getRequest())
            .formCode(formCode)
            .organizationChanges(organizationalChanges)
            .organizationChangesDetails(orgChangeDetails)
            .scopeModifications(scopeChanges)
            .scopeModificationsDetails(scopeChangeDetails)
            .complaintsReceived(complaintsTreated)
            .complaintsDetails(complaintsDetails)
            .qualityIncidents(previousNonConformities)
            .qualityIncidentsDetails(previousNCDetails)
            .keyPersonnelChanges(regulatoryChanges)
            .keyPersonnelChangesDetails(regChangeDetails)
            .raAnalysis(overallRiskLevel + " - " + recommendedActions)
            .analyzedByRA(true)
            .analyzedByRADate(LocalDateTime.now())
            .build();

        form = riskAnalysisRepository.save(form);

        survEval.setRiskAnalysis(form);
        survEval.setStatus(SurveillanceEvaluationStatus.RISK_ANALYSIS_COMPLETED);
        survEvalRepository.save(survEval);

        // Mettre à jour la demande
        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Analyse de risques FOR 77-1 effectuée");
        request.setNextAction("RA demande les documents à l'OEC (FOR 68)");
        request.setPendingWith("RA");
        requestRepository.save(request);

        log.info("Analyse de risques {} créée pour surveillance {}", formCode, survEval.getEvaluationCode());
        return form;
    }

    /**
     * 13.3 RA demande les documents mis à jour à l'OEC (FOR 68)
     */
    @Transactional
    public SurveillanceEvaluation requestDocumentsFromOEC(Long survEvalId,
            String documentsRequested, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        survEval.setDocumentsRequestSent(true);
        survEval.setFocusScope(documentsRequested); // Store requested docs in focusScope field
        survEval.setStatus(SurveillanceEvaluationStatus.DOCUMENTS_REQUESTED);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Documents FOR 68 demandés à l'OEC");
        request.setNextAction("OEC envoie les documents mis à jour sous 15 jours");
        request.setPendingWith("OEC");
        requestRepository.save(request);

        // Notifier l'OEC
        notificationService.createNotification(
            request.getOec().getId(),
            "Documents de surveillance requis (FOR 68)",
            String.format("Veuillez fournir les documents mis à jour sous 15 jours pour %s. Documents demandés: %s",
                request.getReferenceNumber(), documentsRequested),
            "warning"
        );

        log.info("Documents FOR 68 demandés à l'OEC pour {}", survEval.getEvaluationCode());
        return survEval;
    }

    /**
     * OEC soumet ses documents
     */
    @Transactional
    public SurveillanceEvaluation submitDocuments(Long survEvalId,
            String documentsSubmitted, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        survEval.setDocumentsReceivedFromOEC(true);
        survEval.setDocumentsReceivedDate(LocalDateTime.now());
        survEval.setPreviousActionPlansVerification(documentsSubmitted); // Store submitted docs
        survEval.setStatus(SurveillanceEvaluationStatus.DOCUMENTS_RECEIVED);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Documents OEC reçus pour surveillance");
        request.setNextAction("RA effectue la revue documentaire surveillance");
        request.setPendingWith("RA");
        requestRepository.save(request);

        // Notifier RA
        notifyRoleUsers(UserRole.RA, "Documents surveillance reçus",
            String.format("Les documents de l'OEC pour %s sont reçus.",
                request.getReferenceNumber()), "info");

        return survEval;
    }

    // ========== ÉTAPE 14 : ÉVALUATION DE SURVEILLANCE ==========

    /**
     * 14.1 RA prépare le devis de surveillance
     */
    @Transactional
    public SurveillanceEvaluation prepareSurveillanceQuotation(Long survEvalId,
            String quotationDetails, Double amount, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        survEval.setQuotationAmount(java.math.BigDecimal.valueOf(amount));
        survEval.setStatus(SurveillanceEvaluationStatus.QUOTATION_SENT);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Devis surveillance envoyé à l'OEC");
        request.setNextAction("OEC accepte le devis");
        request.setPendingWith("OEC");
        requestRepository.save(request);

        notificationService.createNotification(
            request.getOec().getId(),
            "Devis de surveillance",
            String.format("Le devis pour la surveillance de %s est disponible. Montant: %.2f DA",
                request.getReferenceNumber(), amount),
            "info"
        );

        return survEval;
    }

    /**
     * OEC accepte le devis
     */
    @Transactional
    public SurveillanceEvaluation acceptQuotation(Long survEvalId, boolean accepted,
            String rejectionReason, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        if (accepted) {
            survEval.setQuotationAcceptedByOEC(true);
            survEval.setQuotationAcceptedDate(LocalDateTime.now());
            survEval.setStatus(SurveillanceEvaluationStatus.QUOTATION_ACCEPTED);

            AccreditationRequest request = survEval.getRequest();
            request.setCurrentStep("Devis surveillance accepté");
            request.setNextAction("RA constitue l'équipe de surveillance");
            request.setPendingWith("RA");
            requestRepository.save(request);
        } else {
            survEval.setStatus(SurveillanceEvaluationStatus.QUOTATION_REJECTED);
            // Log the rejection for follow-up
            // Log rejection in evaluation findings
            String existing = survEval.getEvaluationFindings() != null ? survEval.getEvaluationFindings() : "";
            survEval.setEvaluationFindings(existing + "\n[DEVIS REJETÉ]: " + rejectionReason);
        }

        return survEvalRepository.save(survEval);
    }

    /**
     * 14.2 RA constitue l'équipe et prépare le plan
     */
    @Transactional
    public SurveillanceEvaluation prepareTeamAndPlan(Long survEvalId,
            Long teamId, String evaluationPlanDetails, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        if (teamId != null) {
            EvaluationTeam team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Équipe non trouvée"));
            survEval.setTeam(team);
        }

        survEval.setEvaluationPlan(evaluationPlanDetails);
        survEval.setStatus(SurveillanceEvaluationStatus.TEAM_DESIGNATED);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Équipe et plan de surveillance constitués");
        request.setNextAction("Conduite de l'évaluation de surveillance");
        request.setPendingWith("Équipe d'évaluation");
        requestRepository.save(request);

        return survEval;
    }

    /**
     * 14.3 Conduite de l'évaluation de surveillance
     */
    @Transactional
    public SurveillanceEvaluation startSurveillanceEvaluation(Long survEvalId, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        survEval.setEvaluationDate(LocalDateTime.now());
        survEval.setStatus(SurveillanceEvaluationStatus.IN_PROGRESS);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setStatus(RequestStatus.SURVEILLANCE_IN_PROGRESS);
        request.setCurrentStep("Évaluation de surveillance en cours");
        request.setNextAction("Équipe évalue conformément au plan");
        request.setPendingWith("Équipe d'évaluation");
        requestRepository.save(request);

        log.info("Évaluation de surveillance {} démarrée", survEval.getEvaluationCode());
        return survEval;
    }

    /**
     * 14.4 REE rédige le rapport de surveillance
     */
    @Transactional
    public SurveillanceEvaluation completeSurveillanceEvaluation(Long survEvalId,
            String findings, String recommendation, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        survEval.setEvaluationFindings(findings);
        survEval.setCasRecommendation(recommendation);
        survEval.setReportDraftedDate(LocalDateTime.now());
        survEval.setStatus(SurveillanceEvaluationStatus.REPORT_DRAFTING);
        survEvalRepository.save(survEval);

        AccreditationRequest request = survEval.getRequest();
        request.setCurrentStep("Rapport de surveillance rédigé");
        request.setNextAction("Rapport soumis au RA/CD pour validation");
        request.setPendingWith("RA / CD");
        requestRepository.save(request);

        // Notifier RA et CD
        notifyRoleUsers(UserRole.RA, "Rapport de surveillance à valider",
            String.format("Le rapport de surveillance pour %s est prêt pour validation.", request.getReferenceNumber()), "info");
        notifyRoleUsers(UserRole.CD, "Rapport de surveillance à valider",
            String.format("Le rapport de surveillance pour %s est prêt pour validation.", request.getReferenceNumber()), "info");

        return survEval;
    }

    /**
     * RA/CD valide le rapport de surveillance
     */
    @Transactional
    public SurveillanceEvaluation validateSurveillanceReport(Long survEvalId,
            boolean validated, String corrections, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);

        if (validated) {
            survEval.setStatus(SurveillanceEvaluationStatus.REPORT_VALIDATED);

            AccreditationRequest request = survEval.getRequest();
            request.setCurrentStep("Rapport de surveillance validé");
            request.setNextAction("Dossier à présenter au CAS");
            request.setPendingWith("CAS");
            requestRepository.save(request);
        } else {
            survEval.setStatus(SurveillanceEvaluationStatus.REPORT_DRAFTING);
            survEval.setEvaluationFindings(survEval.getEvaluationFindings() + "\n[CORRECTIONS DEMANDÉES]: " + corrections);
        }

        return survEvalRepository.save(survEval);
    }

    // ========== ÉTAPE 15 : DÉCISION CAS SURVEILLANCE ==========

    /**
     * 15.1 Présentation au CAS
     */
    @Transactional
    public CASMeeting scheduleSurveillanceCASMeeting(Long survEvalId,
            LocalDateTime meetingDate, String agenda, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);
        AccreditationRequest request = survEval.getRequest();

        String meetingCode = "CAS-SURV-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        CASMeeting meeting = CASMeeting.builder()
            .request(request)
            .meetingCode(meetingCode)
            .meetingDate(meetingDate)
            .agenda(agenda)
            .dossierSummary(String.format("Surveillance %s - %s\nFindings: %s\nRecommendation: %s",
                survEval.getEvaluationCode(), request.getReferenceNumber(),
                survEval.getEvaluationFindings(), survEval.getCasRecommendation()))
            .status(CASMeetingStatus.PLANNED)
            .build();

        meeting = casMeetingRepository.save(meeting);

        survEval.setDossierPreparedForCAS(true);
        survEval.setStatus(SurveillanceEvaluationStatus.CAS_SUBMITTED);
        survEvalRepository.save(survEval);

        request.setCurrentStep("Réunion CAS surveillance programmée");
        request.setNextAction("CAS examine le dossier de surveillance");
        request.setPendingWith("CAS");
        requestRepository.save(request);

        notificationService.notifyCASMembersScheduled(request, meetingDate);

        log.info("Réunion CAS surveillance {} programmée pour {}", meetingCode, meetingDate);
        return meeting;
    }

    /**
     * 15.2 CAS rend sa décision sur la surveillance
     */
    @Transactional
    public CASDecision recordSurveillanceCASDecision(Long survEvalId,
            CASDecisionType decisionType, String justification,
            String scope, String conditions, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);
        AccreditationRequest request = survEval.getRequest();

        String decisionNumber = "DEC-SURV-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

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

        // Link decision to the surveillance evaluation request

        switch (decisionType) {
            case MAINTAIN:
                // Maintien de l'accréditation
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setStatus(RequestStatus.ACTIVE);
                request.setCurrentStep("Accréditation maintenue après surveillance");
                request.setNextAction("Programmer prochaine surveillance");
                notificationService.notifyOECAccreditationMaintained(request);
                // Mettre à jour la date de prochaine surveillance
                updateNextSurveillanceDate(survEval);
                break;

            case SUSPENSION:
                // Suspension temporaire (PRO 23)
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setStatus(RequestStatus.SUSPENDED);
                request.setCurrentStep("Accréditation suspendue suite à surveillance");
                request.setNextAction("OEC doit corriger les manquements");
                notificationService.notifyOECAccreditationSuspended(request, justification);
                break;

            case WITHDRAWAL:
                // Retrait d'accréditation (PRO 23)
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setStatus(RequestStatus.WITHDRAWN);
                request.setCurrentStep("Accréditation retirée suite à surveillance");
                notificationService.notifyOECAccreditationWithdrawn(request, justification);
                break;

            case SCOPE_REDUCTION:
                // Réduction de portée
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setStatus(RequestStatus.ACTIVE);
                request.setCurrentStep("Portée d'accréditation réduite après surveillance");
                notificationService.notifyOECScopeReduced(request, scope);
                break;

            case GRANT_WITH_RESERVES:
                // Maintien avec réserves
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setStatus(RequestStatus.ACTIVE);
                request.setCurrentStep("Accréditation maintenue avec réserves");
                request.setNextAction("OEC doit lever les réserves avant la date limite");
                notificationService.notifyOECAccreditationMaintained(request);
                break;

            case POSTPONEMENT:
                // Report de la décision (besoin évaluation complémentaire, etc.)
                survEval.setStatus(SurveillanceEvaluationStatus.CAS_SUBMITTED);
                request.setStatus(RequestStatus.SURVEILLANCE_IN_PROGRESS);
                request.setCurrentStep("Décision reportée - informations complémentaires requises");
                notificationService.notifyOECAccreditationPostponed(request, justification);
                break;

            default:
                survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
                request.setCurrentStep("Décision CAS surveillance: " + decisionType.name());
                break;
        }

        request.setPendingWith(decisionType == CASDecisionType.POSTPONEMENT ? "RA / Équipe" : "");
        survEvalRepository.save(survEval);
        requestRepository.save(request);

        log.info("Décision CAS surveillance {} : {} pour {}", decisionNumber, decisionType, request.getReferenceNumber());
        return decision;
    }

    /**
     * 15.3 Application des sanctions (PRO 23) – suspension
     */
    @Transactional
    public AccreditationRequest applySuspension(Long requestId, String reason,
            LocalDateTime suspensionEndDate, String correctiveRequirements, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        request.setStatus(RequestStatus.SUSPENDED);
        request.setCurrentStep("Accréditation suspendue - PRO 23");
        request.setNextAction(String.format("OEC doit corriger avant le %s. %s",
            suspensionEndDate.toLocalDate(), correctiveRequirements));
        request.setPendingWith("OEC");
        requestRepository.save(request);

        notificationService.notifyOECAccreditationSuspended(request, reason);
        log.info("Suspension appliquée pour {} jusqu'au {}", request.getReferenceNumber(), suspensionEndDate);
        return request;
    }

    /**
     * 15.3 Application des sanctions (PRO 23) – retrait
     */
    @Transactional
    public AccreditationRequest applyWithdrawal(Long requestId, String reason, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        request.setStatus(RequestStatus.WITHDRAWN);
        request.setCurrentStep("Accréditation retirée - PRO 23");
        request.setNextAction("Droit de recours notifié à l'OEC");
        request.setPendingWith("");
        requestRepository.save(request);

        // Invalider le certificat
        certificateRepository.findByRequest_Id(requestId).ifPresent(cert -> {
            cert.setPublished(false);
            certificateRepository.save(cert);
        });

        notificationService.notifyOECAccreditationWithdrawn(request, reason);
        log.info("Retrait d'accréditation pour {}: {}", request.getReferenceNumber(), reason);
        return request;
    }

    /**
     * Levée de suspension après corrections de l'OEC
     */
    @Transactional
    public AccreditationRequest liftSuspension(Long requestId, String verificationDetails,
            User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        if (request.getStatus() != RequestStatus.SUSPENDED) {
            throw new RuntimeException("La demande n'est pas en état de suspension");
        }

        request.setStatus(RequestStatus.ACTIVE);
        request.setCurrentStep("Suspension levée - Accréditation réactivée");
        request.setNextAction("Programmer prochaine surveillance");
        request.setPendingWith("RA");
        requestRepository.save(request);

        notificationService.createNotification(
            request.getOec().getId(),
            "Suspension levée",
            String.format("La suspension de votre accréditation %s est levée. %s",
                request.getReferenceNumber(), verificationDetails),
            "success"
        );

        log.info("Suspension levée pour {}", request.getReferenceNumber());
        return request;
    }

    // ========== ÉVALUATION D'EXTENSION (§5.2.2) ==========

    /**
     * Programmer une évaluation d'extension (§5.2.2)
     * L'extension est traitée comme une évaluation initiale (PRO 12)
     * Durée min: 1 jour. Délai écarts: 6 mois.
     */
    @Transactional
    public SurveillanceEvaluation programmeExtension(Long certificateId, Long requestId,
            LocalDateTime plannedDate, String extensionScope, String extensionType, User currentUser) {
        if (currentUser.getRole() != UserRole.RA && currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls RA/CD peuvent programmer une extension");
        }

        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String evalCode = "EXT-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        SurveillanceEvaluation survEval = SurveillanceEvaluation.builder()
            .certificate(certificate)
            .request(request)
            .evaluationCode(evalCode)
            .evaluationDate(plannedDate)
            .focusScope(extensionScope)
            .evaluationType("EXTENSION")
            .extensionType(extensionType)
            .findingDeadlineMonths(EXTENSION_FINDING_DEADLINE_MONTHS)
            .status(SurveillanceEvaluationStatus.PLANNED)
            .build();

        survEval = survEvalRepository.save(survEval);

        request.setStatus(RequestStatus.EXTENSION_REQUESTED);
        request.setCurrentPhase("Phase IV : Extension d'accréditation");
        request.setCurrentStep("Évaluation d'extension programmée");
        request.setNextAction("Procéder comme évaluation initiale (PRO 12)");
        request.setPendingWith("RA");
        requestRepository.save(request);

        log.info("Extension {} programmée - type: {}, portée: {}", evalCode, extensionType, extensionScope);
        return survEval;
    }

    // ========== ÉVALUATION DE RENOUVELLEMENT (§5.2.3) ==========

    /**
     * Programmer une évaluation de renouvellement (§5.2.3)
     * Identique à l'évaluation initiale (PRO 12)
     * Gestion des délais selon Annexe 2
     */
    @Transactional
    public SurveillanceEvaluation programmeRenewal(Long certificateId, Long requestId,
            LocalDateTime plannedDate, User currentUser) {
        if (currentUser.getRole() != UserRole.RA && currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls RA/CD peuvent programmer un renouvellement");
        }

        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String evalCode = "REN-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        SurveillanceEvaluation survEval = SurveillanceEvaluation.builder()
            .certificate(certificate)
            .request(request)
            .evaluationCode(evalCode)
            .evaluationDate(plannedDate)
            .evaluationType("RENOUVELLEMENT")
            .status(SurveillanceEvaluationStatus.PLANNED)
            .build();

        survEval = survEvalRepository.save(survEval);

        request.setStatus(RequestStatus.RENEWAL_INITIATED);
        request.setCurrentPhase("Phase IV : Renouvellement d'accréditation");
        request.setCurrentStep("Évaluation de renouvellement programmée");
        request.setNextAction("Procéder comme évaluation initiale (PRO 12)");
        request.setPendingWith("RA");
        requestRepository.save(request);

        log.info("Renouvellement {} programmé pour certificat {}", evalCode, certificate.getCertificateNumber());
        return survEval;
    }

    /**
     * Calculer les dates de renouvellement selon Annexe 2 (§5.2.3)
     *
     * Cas 1 (A < T < B): date effet = T, expiration = T + 4 ans
     * Cas 1 (T = B): date effet = B, expiration = B + 4 ans
     * Cas 2 (B < T ≤ D): prolongation 3 mois, date effet = C, expiration = B + 4 ans
     * Cas 2 (T = D): date effet = D, expiration = D + 3 ans
     * Cas 3 (T > D): bascule en initiale, nouveau numéro, date effet = E, expiration = E + 3 ans
     */
    public Map<String, Object> calculateRenewalDates(Long certificateId, LocalDateTime decisionDate) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));

        LocalDateTime expiryDate = certificate.getExpirationDate(); // B
        LocalDateTime extensionLimit = expiryDate.plusMonths(RENEWAL_EXTENSION_MAX_MONTHS); // D = B + 3 mois

        Map<String, Object> result = new HashMap<>();
        result.put("certificateId", certificateId);
        result.put("expiryDate", expiryDate);
        result.put("extensionLimit", extensionLimit);
        result.put("decisionDate", decisionDate);

        if (decisionDate.isBefore(expiryDate) || decisionDate.isEqual(expiryDate)) {
            // Cas 1: terminé avant ou à l'expiration
            result.put("case", "CASE_1");
            result.put("effectiveDate", decisionDate);
            result.put("newExpiryDate", expiryDate.plusYears(4));
            result.put("sameAccreditationNumber", true);
            result.put("cycleDuration", 4);
        } else if (decisionDate.isBefore(extensionLimit) || decisionDate.isEqual(extensionLimit)) {
            // Cas 2: prolongation accordée (max 3 mois après B)
            if (decisionDate.isEqual(extensionLimit)) {
                result.put("case", "CASE_2_LIMIT");
                result.put("effectiveDate", extensionLimit);
                result.put("newExpiryDate", extensionLimit.plusYears(3));
                result.put("sameAccreditationNumber", true);
                result.put("cycleDuration", 3);
            } else {
                result.put("case", "CASE_2");
                result.put("effectiveDate", decisionDate);
                result.put("newExpiryDate", expiryDate.plusYears(4));
                result.put("sameAccreditationNumber", true);
                result.put("cycleDuration", 4);
            }
            result.put("extensionGranted", true);
        } else {
            // Cas 3: au-delà de D → bascule en initiale
            result.put("case", "CASE_3");
            result.put("effectiveDate", decisionDate);
            result.put("newExpiryDate", decisionDate.plusYears(3));
            result.put("sameAccreditationNumber", false);
            result.put("newAccreditationRequired", true);
            result.put("cycleDuration", 3);
        }

        return result;
    }

    /**
     * Appliquer la décision de renouvellement avec gestion des délais (Annexe 2)
     */
    @Transactional
    public AccreditationCertificate applyRenewalDecision(Long survEvalId,
            CASDecisionType decisionType, String justification, User currentUser) {
        SurveillanceEvaluation survEval = getSurvEvalOrThrow(survEvalId);
        AccreditationRequest request = survEval.getRequest();
        AccreditationCertificate certificate = survEval.getCertificate();

        Map<String, Object> renewalDates = calculateRenewalDates(certificate.getId(), LocalDateTime.now());
        String renewalCase = (String) renewalDates.get("case");
        boolean sameNumber = (boolean) renewalDates.get("sameAccreditationNumber");

        if (decisionType == CASDecisionType.GRANT || decisionType == CASDecisionType.MAINTAIN) {
            LocalDateTime effectiveDate = (LocalDateTime) renewalDates.get("effectiveDate");
            LocalDateTime newExpiry = (LocalDateTime) renewalDates.get("newExpiryDate");

            if (sameNumber) {
                // Mettre à jour le certificat existant
                certificate.setIssueDate(effectiveDate);
                certificate.setExpirationDate(newExpiry);
                certificateRepository.save(certificate);
            } else {
                // Cas 3: nouveau numéro d'accréditation, même numéro d'enregistrement
                certificate.setPublished(false);
                certificateRepository.save(certificate);

                // Le nouveau certificat sera créé via le processus initial normal
                request.setStatus(RequestStatus.INITIAL_EVALUATION);
                request.setCurrentStep("Renouvellement hors délai - Basculé en accréditation initiale");
                request.setNextAction("Traiter comme nouvelle accréditation avec nouveau numéro");
                requestRepository.save(request);
                log.warn("Renouvellement {} hors délai (cas {}), basculé en initiale", survEval.getEvaluationCode(), renewalCase);
                return certificate;
            }

            survEval.setStatus(SurveillanceEvaluationStatus.COMPLETED);
            survEvalRepository.save(survEval);

            request.setStatus(RequestStatus.RENEWAL_COMPLETED);
            request.setCurrentStep("Renouvellement accordé (cas " + renewalCase + ")");
            request.setNextAction("Envoyer notification, certificat et plan de surveillance à l'OEC");
            request.setPendingWith("RA");
            requestRepository.save(request);

            // Créer plan de surveillance pour le nouveau cycle
            createSurveillancePlanForCycle(certificate, 2); // 2ème cycle

            notificationService.createNotification(
                request.getOec().getId(),
                "Renouvellement d'accréditation accordé",
                String.format("Votre accréditation %s est renouvelée. Nouveau cycle: %s → %s",
                    certificate.getCertificateNumber(), effectiveDate.toLocalDate(), newExpiry.toLocalDate()),
                "success"
            );

            log.info("Renouvellement {} accordé (cas {}) - certificat {} renouvelé",
                survEval.getEvaluationCode(), renewalCase, certificate.getCertificateNumber());
        }

        return certificate;
    }

    // ========== SURVEILLANCE EXTRAORDINAIRE (§5.2.1) ==========

    /**
     * Initier une surveillance extraordinaire (§5.2.1 dernier paragraphe)
     * Motifs: réclamations tiers, réorganisation importante, transfert d'accréditation
     */
    @Transactional
    public SurveillanceEvaluation programmeExtraordinarySurveillance(Long certificateId,
            Long requestId, String reason, String triggerType, User currentUser) {
        if (currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seul le CD peut initier une surveillance extraordinaire");
        }

        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String evalCode = "SURV-EXTRA-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        SurveillanceEvaluation survEval = SurveillanceEvaluation.builder()
            .certificate(certificate)
            .request(request)
            .evaluationCode(evalCode)
            .evaluationType("EXTRAORDINAIRE")
            .focusScope(reason)
            .extraordinaryReason(triggerType)
            .status(SurveillanceEvaluationStatus.PLANNED)
            .build();

        survEval = survEvalRepository.save(survEval);

        request.setCurrentStep("Surveillance extraordinaire déclenchée");
        request.setNextAction("CD justifie et programme l'évaluation extraordinaire");
        request.setPendingWith("CD");
        requestRepository.save(request);

        notifyRoleUsers(UserRole.RA, "Surveillance extraordinaire initiée",
            String.format("Le CD a initié une surveillance extraordinaire pour %s. Motif: %s (%s)",
                request.getReferenceNumber(), reason, triggerType), "warning");

        log.info("Surveillance extraordinaire {} initiée - motif: {} ({})", evalCode, reason, triggerType);
        return survEval;
    }

    // ========== VÉRIFICATION DES DÉLAIS (§5.1 + §5.2.1.1) ==========

    /**
     * Vérifier les délais de surveillance et déclencher suspension si nécessaire (§5.1)
     */
    @Transactional
    public List<Map<String, Object>> checkSurveillanceDeadlines() {
        List<Map<String, Object>> violations = new ArrayList<>();

        List<SurveillanceEvaluation> planned = survEvalRepository.findByStatus(SurveillanceEvaluationStatus.PLANNED);
        for (SurveillanceEvaluation eval : planned) {
            if (eval.getEvaluationDate() == null || eval.getCertificate() == null) continue;

            AccreditationCertificate cert = eval.getCertificate();
            LocalDateTime grantDate = cert.getIssueDate();
            if (grantDate == null) continue;

            long monthsSinceGrant = ChronoUnit.MONTHS.between(grantDate, eval.getEvaluationDate());
            int cycleNumber = determineCycleNumber(cert);
            int surveillanceNumber = determineSurveillanceNumber(eval);

            int maxMonths = getMaxMonthsForSurveillance(cycleNumber, surveillanceNumber);

            if (monthsSinceGrant > maxMonths) {
                Map<String, Object> violation = new HashMap<>();
                violation.put("evaluationId", eval.getId());
                violation.put("evaluationCode", eval.getEvaluationCode());
                violation.put("certificateNumber", cert.getCertificateNumber());
                violation.put("monthsSinceGrant", monthsSinceGrant);
                violation.put("maxMonths", maxMonths);
                violation.put("cycleNumber", cycleNumber);
                violation.put("surveillanceNumber", surveillanceNumber);
                violation.put("overdueDays", ChronoUnit.DAYS.between(
                    grantDate.plusMonths(maxMonths), eval.getEvaluationDate()));
                violations.add(violation);
            }
        }

        return violations;
    }

    /**
     * Vérifier les délais des écarts (§5.2.1.1)
     * Non critique: 3 mois max
     * Critique: 2,5 mois max
     */
    @Transactional
    public List<Map<String, Object>> checkFindingDeadlines() {
        List<Map<String, Object>> overdueFindings = new ArrayList<>();

        List<SurveillanceEvaluation> withFindings = survEvalRepository.findByStatusIn(Arrays.asList(
            SurveillanceEvaluationStatus.EVALUATION_COMPLETED,
            SurveillanceEvaluationStatus.REPORT_DRAFTING,
            SurveillanceEvaluationStatus.REPORT_VALIDATED
        ));

        for (SurveillanceEvaluation eval : withFindings) {
            if (eval.getEvaluationDate() == null || !Boolean.TRUE.equals(eval.getHasNewGaps())) continue;

            long daysSinceEval = ChronoUnit.DAYS.between(eval.getEvaluationDate(), LocalDateTime.now());
            int deadlineMonths = eval.getFindingDeadlineMonths() != null
                ? eval.getFindingDeadlineMonths()
                : NON_CRITICAL_FINDING_DEADLINE_MONTHS;

            long deadlineDays = (long)(deadlineMonths * 30.44); // Avg days per month

            if (daysSinceEval > deadlineDays) {
                Map<String, Object> overdue = new HashMap<>();
                overdue.put("evaluationId", eval.getId());
                overdue.put("evaluationCode", eval.getEvaluationCode());
                overdue.put("daysSinceEvaluation", daysSinceEval);
                overdue.put("deadlineDays", deadlineDays);
                overdue.put("overdueDays", daysSinceEval - deadlineDays);
                overdue.put("evaluationType", eval.getEvaluationType());
                overdueFindings.add(overdue);
            }
        }

        return overdueFindings;
    }

    // ========== CYCLE D'ACCRÉDITATION (§5.1) ==========

    /**
     * Créer un plan de surveillance pour un cycle d'accréditation (§5.1 + FOR 66)
     */
    @Transactional
    public SurveillancePlan createSurveillancePlanForCycle(AccreditationCertificate certificate, int cycleNumber) {
        String planCode = "FOR66-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        int surveillanceCount = (cycleNumber == 1) ? 2 : 3;
        int cycleDurationYears = (cycleNumber == 1) ? 3 : 4;

        LocalDateTime grantDate = certificate.getIssueDate();
        StringBuilder calendar = new StringBuilder();
        calendar.append("Cycle ").append(cycleNumber).append(" (").append(cycleDurationYears).append(" ans)\n");
        for (int i = 1; i <= surveillanceCount; i++) {
            LocalDateTime survDate = grantDate.plusMonths(12L * i);
            calendar.append("  Surveillance S").append(i).append(": ").append(survDate.toLocalDate()).append("\n");
        }
        calendar.append("  Renouvellement: ").append(grantDate.plusYears(cycleDurationYears).toLocalDate());

        SurveillancePlan plan = SurveillancePlan.builder()
            .certificate(certificate)
            .planCode(planCode)
            .surveillanceCalendar(calendar.toString())
            .frequency("ANNUELLE")
            .cycleNumber(cycleNumber)
            .cycleDurationYears(cycleDurationYears)
            .surveillanceCount(surveillanceCount)
            .nextSurveillanceDate(grantDate.plusMonths(12))
            .estimatedDurationPerEvaluation(2)
            .build();

        plan = surveillancePlanRepository.save(plan);
        log.info("Plan de surveillance {} créé pour cycle {} - certificat {}",
            planCode, cycleNumber, certificate.getCertificateNumber());
        return plan;
    }

    /**
     * Obtenir les détails du cycle d'accréditation courant
     */
    public Map<String, Object> getAccreditationCycleInfo(Long certificateId) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));

        SurveillancePlan plan = surveillancePlanRepository.findByCertificate_Id(certificateId).orElse(null);
        List<SurveillanceEvaluation> history = survEvalRepository.findByCertificate_Id(certificateId);

        int cycleNumber = determineCycleNumber(certificate);
        int cycleDuration = (cycleNumber == 1) ? 3 : 4;
        int totalSurveillances = (cycleNumber == 1) ? 2 : 3;
        long completedSurveillances = history.stream()
            .filter(e -> e.getStatus() == SurveillanceEvaluationStatus.COMPLETED
                && "SURVEILLANCE".equals(e.getEvaluationType()))
            .count();

        Map<String, Object> info = new HashMap<>();
        info.put("certificateId", certificateId);
        info.put("certificateNumber", certificate.getCertificateNumber());
        info.put("cycleNumber", cycleNumber);
        info.put("cycleDurationYears", cycleDuration);
        info.put("effectiveDate", certificate.getIssueDate());
        info.put("expiryDate", certificate.getExpirationDate());
        info.put("totalSurveillancesRequired", totalSurveillances);
        info.put("completedSurveillances", completedSurveillances);
        info.put("remainingSurveillances", totalSurveillances - completedSurveillances);
        info.put("surveillanceHistory", history);
        info.put("plan", plan);

        if (plan != null) {
            info.put("nextSurveillanceDate", plan.getNextSurveillanceDate());
        }

        // Calculer la date de soumission du dossier de renouvellement (6 mois avant)
        if (certificate.getExpirationDate() != null) {
            info.put("renewalSubmissionDeadline", certificate.getExpirationDate().minusMonths(6));
        }

        return info;
    }

    /**
     * Obtenir toutes les évaluations (surveillance, extension, renouvellement) d'un certificat
     */
    public List<SurveillanceEvaluation> getSurveillanceHistory(Long certificateId) {
        return survEvalRepository.findByCertificate_Id(certificateId);
    }

    /**
     * Obtenir toutes les évaluations de surveillance (pas extensions ni renouvellements)
     */
    public List<SurveillanceEvaluation> getAllSurveillanceEvaluations() {
        return survEvalRepository.findAll();
    }

    /**
     * Obtenir les surveillances à venir
     */
    public List<SurveillanceEvaluation> getUpcomingSurveillances() {
        return survEvalRepository.findByStatusIn(Arrays.asList(
            SurveillanceEvaluationStatus.PLANNED,
            SurveillanceEvaluationStatus.RISK_ANALYSIS_SENT,
            SurveillanceEvaluationStatus.RISK_ANALYSIS_COMPLETED,
            SurveillanceEvaluationStatus.RISK_ANALYZED,
            SurveillanceEvaluationStatus.DOCUMENTS_REQUESTED,
            SurveillanceEvaluationStatus.DOCUMENTS_RECEIVED,
            SurveillanceEvaluationStatus.QUOTATION_SENT,
            SurveillanceEvaluationStatus.QUOTATION_ACCEPTED,
            SurveillanceEvaluationStatus.TEAM_DESIGNATED,
            SurveillanceEvaluationStatus.TEAM_VALIDATED,
            SurveillanceEvaluationStatus.PLAN_PREPARED,
            SurveillanceEvaluationStatus.PLAN_VALIDATED,
            SurveillanceEvaluationStatus.PLAN_SENT_TO_OEC,
            SurveillanceEvaluationStatus.MISSION_ORDERS_APPROVED,
            SurveillanceEvaluationStatus.MISSION_ORDERS_SENT
        ));
    }

    /**
     * Obtenir les surveillances en retard
     */
    public List<SurveillanceEvaluation> getOverdueSurveillances() {
        return survEvalRepository.findByStatusAndEvaluationDateBefore(
            SurveillanceEvaluationStatus.PLANNED, LocalDateTime.now());
    }

    /**
     * Obtenir les évaluations en cours (toutes phases actives)
     */
    public List<SurveillanceEvaluation> getInProgressEvaluations() {
        return survEvalRepository.findByStatusIn(Arrays.asList(
            SurveillanceEvaluationStatus.IN_PROGRESS,
            SurveillanceEvaluationStatus.EVALUATION_COMPLETED,
            SurveillanceEvaluationStatus.REPORT_DRAFTING,
            SurveillanceEvaluationStatus.REPORT_VALIDATION,
            SurveillanceEvaluationStatus.REPORT_VALIDATED,
            SurveillanceEvaluationStatus.CAS_PREPARATION,
            SurveillanceEvaluationStatus.CAS_SUBMITTED
        ));
    }

    /**
     * Obtenir les évaluations terminées
     */
    public List<SurveillanceEvaluation> getCompletedEvaluations() {
        return survEvalRepository.findByStatus(SurveillanceEvaluationStatus.COMPLETED);
    }

    // ========== PRIVATE HELPERS ==========

    private int determineCycleNumber(AccreditationCertificate certificate) {
        List<SurveillanceEvaluation> renewals = survEvalRepository.findByCertificate_Id(certificate.getId())
            .stream()
            .filter(e -> "RENOUVELLEMENT".equals(e.getEvaluationType())
                && e.getStatus() == SurveillanceEvaluationStatus.COMPLETED)
            .toList();
        return renewals.isEmpty() ? 1 : renewals.size() + 1;
    }

    private int determineSurveillanceNumber(SurveillanceEvaluation eval) {
        List<SurveillanceEvaluation> allSurvs = survEvalRepository
            .findByCertificate_Id(eval.getCertificate().getId())
            .stream()
            .filter(e -> !"EXTENSION".equals(e.getEvaluationType())
                && !"RENOUVELLEMENT".equals(e.getEvaluationType())
                && !"EXTRAORDINAIRE".equals(e.getEvaluationType()))
            .sorted(Comparator.comparing(e -> e.getCreatedAt() != null ? e.getCreatedAt() : LocalDateTime.MIN))
            .toList();

        for (int i = 0; i < allSurvs.size(); i++) {
            if (allSurvs.get(i).getId().equals(eval.getId())) return i + 1;
        }
        return 1;
    }

    private int getMaxMonthsForSurveillance(int cycleNumber, int surveillanceNumber) {
        if (surveillanceNumber == 1) return FIRST_SURVEILLANCE_MAX_MONTHS;
        if (surveillanceNumber == 2) {
            return cycleNumber == 1 ? SECOND_SURVEILLANCE_CYCLE1_MAX_MONTHS : SECOND_SURVEILLANCE_CYCLE2_MAX_MONTHS;
        }
        if (surveillanceNumber == 3 && cycleNumber >= 2) return THIRD_SURVEILLANCE_MAX_MONTHS;
        return 14; // default
    }

    private void updateNextSurveillanceDate(SurveillanceEvaluation survEval) {
        SurveillancePlan plan = surveillancePlanRepository
            .findByCertificate_Id(survEval.getCertificate().getId())
            .orElse(null);
        if (plan != null) {
            // PRO 25 §5.1: surveillances annuelles espacées de 12 mois
            LocalDateTime nextDate = LocalDateTime.now().plusMonths(12);
            plan.setNextSurveillanceDate(nextDate);
            surveillancePlanRepository.save(plan);
        }
    }

    private SurveillanceEvaluation getSurvEvalOrThrow(Long id) {
        return survEvalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Évaluation de surveillance non trouvée: " + id));
    }

    private void notifyRoleUsers(UserRole role, String title, String message, String type) {
        List<User> users = userRepository.findByRole(role);
        for (User user : users) {
            notificationService.createNotification(user.getId(), title, message, type);
        }
    }
}
