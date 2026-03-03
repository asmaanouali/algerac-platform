package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.*;

/**
 * Service gérant la Phase IV : Surveillance Périodique
 * Couvre les étapes 13, 14 et 15 du processus d'accréditation PRO 12
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

    // ========== ÉTAPE 13 : PROGRAMMATION SURVEILLANCE ==========

    /**
     * 13.1 RA programme la surveillance (basée sur FOR 66)
     */
    @Transactional
    public SurveillanceEvaluation programmeSurveillance(Long certificateId, Long requestId,
            LocalDateTime plannedDate, String scope, User currentUser) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));
        AccreditationRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String evalCode = "SURV-" + Year.now().getValue() + "-" +
            String.format("%04d", new Random().nextInt(9999));

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
            String.format("%04d", new Random().nextInt(9999));

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
            survEval.setStatus(SurveillanceEvaluationStatus.QUOTATION_SENT);
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
            String.format("%04d", new Random().nextInt(9999));

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
            String.format("%04d", new Random().nextInt(9999));

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

    /**
     * Obtenir toutes les évaluations de surveillance pour un certificat
     */
    public List<SurveillanceEvaluation> getSurveillanceHistory(Long certificateId) {
        return survEvalRepository.findByCertificate_Id(certificateId);
    }

    /**
     * Obtenir les surveillances à venir
     */
    public List<SurveillanceEvaluation> getUpcomingSurveillances() {
        return survEvalRepository.findByStatusIn(Arrays.asList(
            SurveillanceEvaluationStatus.PLANNED,
            SurveillanceEvaluationStatus.RISK_ANALYSIS_COMPLETED,
            SurveillanceEvaluationStatus.DOCUMENTS_REQUESTED
        ));
    }

    /**
     * Obtenir les surveillances en retard
     */
    public List<SurveillanceEvaluation> getOverdueSurveillances() {
        return survEvalRepository.findByStatusAndEvaluationDateBefore(
            SurveillanceEvaluationStatus.PLANNED, LocalDateTime.now());
    }

    // ========== PRIVATE HELPERS ==========

    private void updateNextSurveillanceDate(SurveillanceEvaluation survEval) {
        SurveillancePlan plan = surveillancePlanRepository
            .findByCertificate_Id(survEval.getCertificate().getId())
            .orElse(null);
        if (plan != null) {
            // Par défaut, prochaine surveillance dans 12 mois (annuelle)
            LocalDateTime nextDate = LocalDateTime.now().plusMonths(12);
            if ("SEMESTRIELLE".equals(plan.getFrequency())) {
                nextDate = LocalDateTime.now().plusMonths(6);
            } else if ("TRIMESTRIELLE".equals(plan.getFrequency())) {
                nextDate = LocalDateTime.now().plusMonths(3);
            }
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
