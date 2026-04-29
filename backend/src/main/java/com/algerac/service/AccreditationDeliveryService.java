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
import java.security.SecureRandom;

/**
 * Service gérant la Phase III : Décision d'Accréditation et Délivrance
 * Couvre les étapes 9, 10, 11 et 12 du processus d'accréditation PRO 12
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccreditationDeliveryService {

    private final RequestRepository requestRepository;
    private final EvaluationReportRepository reportRepository;
    private final CASDecisionRepository casDecisionRepository;
    private final CASMeetingRepository casMeetingRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final SurveillancePlanRepository surveillancePlanRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final com.algerac.repository.SatelliteSiteRepository satelliteSiteRepository;

    // ========== ÉTAPE 9 : RAPPORT D'ÉVALUATION ==========

    /**
     * 9.1 REE rédige le rapport (délai 30 jours)
     */
    @Transactional
    public EvaluationReport createEvaluationReport(Long requestId, ReportType type,
            String contextAndObjectives, String teamComposition,
            String programRealized, String findingsByRequirement,
            String gapsSummary, String gapsStatus, String strengths,
            String improvementAreas, String conclusion, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String reportNumber = "RAP-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        // Vérifier délai de 30 jours depuis clôture
        boolean withinDeadline = true;
        if (request.getEvaluationEndDate() != null) {
            withinDeadline = LocalDateTime.now().isBefore(request.getEvaluationEndDate().plusDays(30));
            if (!withinDeadline) {
                log.warn("Rapport {} rédigé hors délai de 30 jours", reportNumber);
            }
        }

        EvaluationReport report = EvaluationReport.builder()
            .request(request)
            .reportNumber(reportNumber)
            .type(type)
            .contextAndObjectives(contextAndObjectives)
            .teamComposition(teamComposition)
            .programRealized(programRealized)
            .findingsByRequirement(findingsByRequirement)
            .gapsSummary(gapsSummary)
            .gapsStatus(gapsStatus)
            .strengths(strengths)
            .improvementAreas(improvementAreas)
            .conclusionAndRecommendation(conclusion)
            .evaluationClosureDate(request.getEvaluationEndDate())
            .draftedByREE(LocalDateTime.now())
            .status(EvaluationReportStatus.DRAFT)
            .build();

        report = reportRepository.save(report);

        request.setStatus(RequestStatus.REPORT_DRAFTING);
        request.setCurrentPhase("Phase III : Décision d'Accréditation");
        request.setCurrentStep("Rapport d'évaluation rédigé par le REE");
        request.setNextAction("REE soumet le rapport au CD/RA pour validation");
        request.setPendingWith("REE");
        requestRepository.save(request);

        log.info("Rapport {} créé pour {}", reportNumber, request.getReferenceNumber());
        return report;
    }

    /**
     * 9.2 REE soumet le rapport au CD pour validation
     */
    @Transactional
    public EvaluationReport submitReportToCD(Long reportId, User currentUser) {
        EvaluationReport report = getReportOrThrow(reportId);

        report.setSubmittedToCD(LocalDateTime.now());
        report.setStatus(EvaluationReportStatus.SUBMITTED_TO_CD);
        reportRepository.save(report);

        AccreditationRequest request = report.getRequest();
        request.setStatus(RequestStatus.REPORT_VALIDATION);
        request.setCurrentStep("Rapport soumis au CD pour validation");
        request.setNextAction("CD examine le rapport (délai 15 jours)");
        request.setPendingWith("CD");
        requestRepository.save(request);

        notificationService.notifyCDReportSubmitted(request, report.getReportNumber());

        log.info("Rapport {} soumis au CD", report.getReportNumber());
        return report;
    }

    /**
     * 9.3 CD examine et valide/corrige le rapport (délai 15 jours)
     */
    @Transactional
    public EvaluationReport validateReport(Long reportId, boolean validated,
            String correctionRequests, String for23Content, User currentUser) {
        EvaluationReport report = getReportOrThrow(reportId);

        if (validated) {
            report.setValidatedByCD(true);
            report.setValidationDate(LocalDateTime.now());
            report.setFOR23AppreciationSheet(for23Content);
            report.setStatus(EvaluationReportStatus.VALIDATED);

            AccreditationRequest request = report.getRequest();
            request.setStatus(RequestStatus.REPORT_VALIDATED);
            request.setCurrentStep("Rapport validé par le CD");
            request.setNextAction("Rapport transmis au département consolidation puis au CAS");
            request.setPendingWith("CD / Consolidation");
            requestRepository.save(request);

            log.info("Rapport {} validé par le CD", report.getReportNumber());
        } else {
            report.setCorrectionRequests(correctionRequests);
            report.setStatus(EvaluationReportStatus.CORRECTIONS_NEEDED);
            reportRepository.save(report);

            AccreditationRequest request = report.getRequest();
            request.setCurrentStep("Corrections demandées sur le rapport");
            request.setNextAction("REE corrige le rapport selon les observations du CD");
            request.setPendingWith("REE");
            requestRepository.save(request);

            notificationService.notifyREECorrectionsNeeded(report.getRequest(), correctionRequests);
            log.info("Corrections demandées pour le rapport {}", report.getReportNumber());
        }

        return reportRepository.save(report);
    }

    /**
     * 9.4 DT vérifie le rapport (optionnel)
     */
    @Transactional
    public EvaluationReport dtValidateReport(Long reportId, boolean approved, User currentUser) {
        EvaluationReport report = getReportOrThrow(reportId);

        report.setValidatedByDT(approved);
        reportRepository.save(report);

        if (approved) {
            log.info("Rapport {} validé par le DT", report.getReportNumber());
        }

        return report;
    }

    /**
     * 9.5 Envoi au département consolidation
     */
    @Transactional
    public EvaluationReport sendToConsolidation(Long reportId, User currentUser) {
        EvaluationReport report = getReportOrThrow(reportId);

        report.setSentToDeptConsolidation(LocalDateTime.now());
        report.setStatus(EvaluationReportStatus.SENT_TO_CONSOLIDATION);
        reportRepository.save(report);

        AccreditationRequest request = report.getRequest();
        request.setStatus(RequestStatus.CAS_PREPARATION);
        request.setCurrentStep("Rapport envoyé en consolidation, préparation CAS");
        request.setNextAction("Programmer la réunion CAS");
        request.setPendingWith("CAS / Administration");
        requestRepository.save(request);

        log.info("Rapport {} envoyé en consolidation", report.getReportNumber());
        return report;
    }

    // ========== ÉTAPE 10 : DÉLIBÉRATION CAS ==========

    /**
     * 10.1 Programmer la réunion CAS
     */
    @Transactional
    public CASMeeting scheduleCASMeeting(Long requestId, LocalDateTime meetingDate,
            String agenda, String dossierSummary, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String meetingCode = "CAS-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        CASMeeting meeting = CASMeeting.builder()
            .request(request)
            .meetingCode(meetingCode)
            .meetingDate(meetingDate)
            .agenda(agenda)
            .dossierSummary(dossierSummary)
            .status(CASMeetingStatus.PLANNED)
            .build();

        meeting = casMeetingRepository.save(meeting);

        request.setStatus(RequestStatus.CAS_SCHEDULED);
        request.setCurrentStep("Réunion CAS programmée le " + meetingDate.toLocalDate());
        request.setNextAction("CAS examine le dossier complet");
        request.setPendingWith("CAS");
        requestRepository.save(request);

        notificationService.notifyCASMembersScheduled(request, meetingDate);

        log.info("Réunion CAS {} programmée le {}", meetingCode, meetingDate);
        return meeting;
    }

    /**
     * 10.2 CAS rend sa décision
     */
    @Transactional
    public CASDecision recordCASDecision(Long requestId, CASDecisionType decisionType,
            String justification, String scope, String conditions,
            String reservesToLift, LocalDateTime reservesDeadline,
            String refusalReason, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String decisionNumber = "DEC-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        // Trouver le rapport le plus récent
        EvaluationReport report = reportRepository.findFirstByRequest_IdOrderByCreatedAtDesc(requestId)
            .orElse(null);

        CASDecision decision = CASDecision.builder()
            .request(request)
            .report(report)
            .decisionNumber(decisionNumber)
            .decisionType(decisionType)
            .meetingDate(LocalDateTime.now())
            .justification(justification)
            .scope(scope)
            .conditions(conditions)
            .reservesToLift(reservesToLift)
            .reservesDeadline(reservesDeadline)
            .refusalReason(refusalReason)
            .appealRightNotified(true)
            .build();

        decision = casDecisionRepository.save(decision);

        // Appliquer la décision
        switch (decisionType) {
            case GRANT_FULL:
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
                request.setCurrentStep("Accréditation octroyée (portée complète)");
                request.setNextAction("Préparer le certificat d'accréditation");
                request.setPendingWith("RA / Administration");
                notificationService.notifyOECAccreditationGranted(request, decisionType, scope);
                break;

            case GRANT_REDUCED:
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
                request.setCurrentStep("Accréditation octroyée (portée réduite)");
                request.setNextAction("Préparer le certificat avec portée réduite");
                request.setPendingWith("RA / Administration");
                notificationService.notifyOECAccreditationGranted(request, decisionType, scope);
                break;

            case GRANT_WITH_RESERVES:
                request.setStatus(RequestStatus.CAS_DECISION_GRANT);
                request.setCurrentStep("Accréditation octroyée avec réserves");
                request.setNextAction("Réserves à lever avant " +
                    (reservesDeadline != null ? reservesDeadline.toLocalDate() : "la date limite"));
                request.setPendingWith("OEC / RA");
                notificationService.notifyOECAccreditationGranted(request, decisionType, scope);
                break;

            case REFUSAL:
                request.setStatus(RequestStatus.CAS_DECISION_REFUSAL);
                request.setCurrentStep("Accréditation refusée");
                request.setNextAction("Notification de refus et droit de recours");
                request.setPendingWith("");
                decision.setAppealRightNotified(true);
                notificationService.notifyOECAccreditationRefused(request, refusalReason);
                break;

            case POSTPONEMENT:
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
                request.setCurrentStep("Décision reportée - informations complémentaires requises");
                request.setNextAction("Fournir les informations complémentaires");
                request.setPendingWith("RA / OEC");
                notificationService.notifyOECAccreditationPostponed(request, justification);
                break;

            case REPORT_DECISION:
                request.setStatus(RequestStatus.CAS_DECISION_POSTPONEMENT);
                request.setCurrentStep("Dossier renvoyé pour complément");
                request.setNextAction("Reprendre l'étude du dossier");
                request.setPendingWith("RA / REE");
                break;

            default:
                request.setCurrentStep("Décision CAS: " + decisionType.name());
                break;
        }

        request.setCasDecisionDate(LocalDateTime.now());
        casDecisionRepository.save(decision);
        requestRepository.save(request);

        log.info("Décision CAS {} : {} pour {}", decisionNumber, decisionType, request.getReferenceNumber());
        return decision;
    }

    // ========== ÉTAPE 11 : PRÉPARATION DU CERTIFICAT ==========

    /**
     * 11.1 RA prépare le certificat d'accréditation (FOR 63-x)
     */
    @Transactional
    public AccreditationCertificate prepareCertificate(Long requestId,
            String oecIdentity, String scope, String technicalDomains,
            String methodsAndStandards, String concernedSites,
            String limitations, String accreditationStandardReference,
            User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        // Vérifier qu'une décision favorable existe, sinon la créer depuis la réunion CAS
        CASDecision decision = casDecisionRepository.findFirstByRequest_IdOrderByCreatedAtDesc(requestId)
            .orElseGet(() -> {
                // Auto-create from CASMeeting (legacy data before fix)
                List<CASMeeting> meetings = casMeetingRepository.findByRequest_Id(requestId);
                CASMeeting meeting = meetings.stream()
                    .filter(m -> m.getFinalDecision() != null)
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Aucune décision CAS trouvée"));
                String fd = meeting.getFinalDecision();
                CASDecisionType dt = fd != null && fd.startsWith("ACCORDER") ? CASDecisionType.GRANT_FULL :
                    "REFUSER".equals(fd) ? CASDecisionType.REFUSAL : CASDecisionType.POSTPONEMENT;
                String dn = "DEC-CAS-" + Year.now().getValue() + "-" +
                    String.format("%04d", new SecureRandom().nextInt(9999));
                CASDecision d = CASDecision.builder()
                    .request(request).decisionNumber(dn).decisionType(dt)
                    .meetingDate(meeting.getMeetingDate())
                    .justification(meeting.getPresidentNotes())
                    .build();
                return casDecisionRepository.save(d);
            });

        if (decision.getDecisionType() != CASDecisionType.GRANT_FULL &&
            decision.getDecisionType() != CASDecisionType.GRANT_REDUCED &&
            decision.getDecisionType() != CASDecisionType.GRANT_WITH_RESERVES) {
            throw new RuntimeException("Le certificat ne peut être émis que pour une décision favorable");
        }

        String certNumber = "CERT-ALG-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        AccreditationCertificate certificate = AccreditationCertificate.builder()
            .request(request)
            .casDecision(decision)
            .certificateNumber(certNumber)
            .issueDate(LocalDateTime.now())
            .expirationDate(LocalDateTime.now().plusYears(4))
            .oecIdentity(oecIdentity)
            .scope(scope)
            .technicalDomains(technicalDomains)
            .methodsAndStandards(methodsAndStandards)
            .concernedSites(concernedSites)
            .limitations(limitations)
            .accreditationStandardReference(accreditationStandardReference)
            .signedByDG(false)
            .signedByDT(false)
            .published(false)
            .build();

        // PRO 26 §5.6 — pour un OEC multisites, populer les champs spécifiques et
        // sélectionner le modèle FOR 16-1 (par défaut FOR 16). Le modèle FOR 16-3 (sites
        // étrangers) sera à sélectionner manuellement par le DT le cas échéant.
        if (Boolean.TRUE.equals(request.getIsMultisite())) {
            certificate.setIsMultisite(true);
            certificate.setHqNameAndAddress(
                (request.getMainSiteName() == null ? "" : request.getMainSiteName()) + " — " +
                (request.getMainSiteAddress() == null ? "" : request.getMainSiteAddress())
            );
            // Construire la liste JSON des sites accrédités (siege + satellites actifs en portée)
            List<SatelliteSite> active = satelliteSiteRepository.findByRequest_IdAndStatus(
                request.getId(), SatelliteSiteStatus.ACTIVE);
            StringBuilder sb = new StringBuilder("[");
            sb.append("{\"type\":\"HQ\",\"name\":\"").append(escapeJson(request.getMainSiteName())).append("\"")
              .append(",\"address\":\"").append(escapeJson(request.getMainSiteAddress())).append("\"}");
            for (SatelliteSite s : active) {
                if (Boolean.FALSE.equals(s.getIsInScope())) continue;
                sb.append(",{\"type\":\"SAT\",\"id\":").append(s.getId())
                  .append(",\"name\":\"").append(escapeJson(s.getName())).append("\"")
                  .append(",\"address\":\"").append(escapeJson(s.getAddress())).append("\"}");
            }
            sb.append("]");
            certificate.setAccreditedSitesJson(sb.toString());
            certificate.setCertificateTemplate(CertificateTemplate.FOR_16_1);
        } else {
            certificate.setCertificateTemplate(CertificateTemplate.FOR_16);
        }

        certificate = certificateRepository.save(certificate);

        request.setStatus(RequestStatus.CERTIFICATE_PREPARATION);
        request.setCurrentStep("Certificat préparé - En attente de signatures");
        request.setNextAction("DT et DG doivent signer le certificat");
        request.setPendingWith("DT / DG");
        requestRepository.save(request);

        log.info("Certificat {} préparé pour {}", certNumber, request.getReferenceNumber());
        return certificate;
    }

    /**
     * 11.2 DT/DG signent le certificat
     */
    @Transactional
    public AccreditationCertificate signCertificate(Long certificateId, UserRole activeRole) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));

        if (activeRole == UserRole.DT) {
            certificate.setSignedByDT(true);
            log.info("Certificat {} signé par DT", certificate.getCertificateNumber());
        } else if (activeRole == UserRole.DG) {
            certificate.setSignedByDG(true);
            log.info("Certificat {} signé par DG", certificate.getCertificateNumber());
        } else {
            throw new RuntimeException("Seuls DT et DG peuvent signer un certificat. Rôle actuel: " + activeRole);
        }

        // Si les deux ont signé → publier
        if (Boolean.TRUE.equals(certificate.getSignedByDT()) &&
            Boolean.TRUE.equals(certificate.getSignedByDG())) {
            certificate.setPublished(true);

            AccreditationRequest request = certificate.getRequest();
            request.setStatus(RequestStatus.CERTIFICATE_ISSUED);
            request.setCertificateIssueDate(LocalDateTime.now());
            request.setCertificateExpirationDate(certificate.getExpirationDate());
            request.setCurrentStep("Certificat signé et publié");
            request.setNextAction("Notifier l'OEC et préparer la surveillance");
            request.setPendingWith("Administration");
            requestRepository.save(request);

            log.info("Certificat {} entièrement signé et publié", certificate.getCertificateNumber());
        }

        return certificateRepository.save(certificate);
    }

    /**
     * 11.3 Publication et notification
     */
    @Transactional
    public AccreditationCertificate publishCertificate(Long certificateId,
            String certificateUrl, String technicalAnnexUrl, User currentUser) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));

        certificate.setCertificateUrl(certificateUrl);
        certificate.setTechnicalAnnexUrl(technicalAnnexUrl);
        certificate.setPublished(true);
        certificateRepository.save(certificate);

        AccreditationRequest request = certificate.getRequest();

        // Notifier l'OEC
        notificationService.notifyOECCertificateIssued(request, certificateUrl);

        // Notifier l'admin pour mise à jour du site web
        notifyRoleUsers(UserRole.DG, "Certificat à publier sur le site web",
            String.format("Le certificat %s pour %s doit être publié sur le site web d'ALGERAC.",
                certificate.getCertificateNumber(), request.getReferenceNumber()), "info");

        log.info("Certificat {} publié: {}", certificate.getCertificateNumber(), certificateUrl);
        return certificate;
    }

    // ========== ÉTAPE 12 : PLAN DE SURVEILLANCE ==========

    /**
     * 12.1 Créer le plan de surveillance (FOR 66)
     */
    @Transactional
    public SurveillancePlan createSurveillancePlan(Long certificateId,
            String surveillanceCalendar, String frequency,
            String scopeSampling, Integer estimatedDuration,
            LocalDateTime firstSurveillanceDate, User currentUser) {
        AccreditationCertificate certificate = certificateRepository.findById(certificateId)
            .orElseThrow(() -> new RuntimeException("Certificat non trouvé"));

        String planCode = "FOR66-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        SurveillancePlan plan = SurveillancePlan.builder()
            .certificate(certificate)
            .planCode(planCode)
            .surveillanceCalendar(surveillanceCalendar)
            .frequency(frequency)
            .scopeSampling(scopeSampling)
            .estimatedDurationPerEvaluation(estimatedDuration)
            .nextSurveillanceDate(firstSurveillanceDate)
            .satisfactionFormFOR22Sent(false)
            .build();

        plan = surveillancePlanRepository.save(plan);

        // Finaliser la demande en tant qu'active
        AccreditationRequest request = certificate.getRequest();
        request.setStatus(RequestStatus.ACTIVE);
        request.setCurrentPhase("Accréditation active - Surveillance");
        request.setCurrentStep("Accréditation active avec plan de surveillance");
        request.setNextAction("Prochaine surveillance: " + firstSurveillanceDate.toLocalDate());
        request.setPendingWith("RA (suivi surveillance)");
        request.setProgress(100);
        requestRepository.save(request);

        // Notifier l'OEC
        notificationService.createNotification(
            request.getOec().getId(),
            "Plan de surveillance établi",
            String.format("Le plan de surveillance FOR 66 pour votre accréditation %s est établi. " +
                "Fréquence: %s. Prochaine évaluation: %s",
                request.getReferenceNumber(), frequency, firstSurveillanceDate.toLocalDate()),
            "info"
        );

        log.info("Plan de surveillance {} créé pour certificat {}", planCode, certificate.getCertificateNumber());
        return plan;
    }

    /**
     * 12.2 Envoyer le formulaire FOR 22 (satisfaction)
     */
    @Transactional
    public SurveillancePlan sendSatisfactionForm(Long planId, User currentUser) {
        SurveillancePlan plan = surveillancePlanRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Plan de surveillance non trouvé"));

        plan.setSatisfactionFormFOR22Sent(true);
        surveillancePlanRepository.save(plan);

        AccreditationRequest request = plan.getCertificate().getRequest();
        notificationService.createNotification(
            request.getOec().getId(),
            "Formulaire de satisfaction FOR 22",
            "Merci de remplir le formulaire de satisfaction FOR 22 concernant votre processus d'accréditation.",
            "info"
        );

        log.info("Formulaire FOR 22 envoyé pour plan {}", plan.getPlanCode());
        return plan;
    }

    /**
     * OEC soumet le retour de satisfaction FOR 22
     */
    @Transactional
    public SurveillancePlan submitSatisfactionFeedback(Long planId, String feedback, User currentUser) {
        SurveillancePlan plan = surveillancePlanRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Plan de surveillance non trouvé"));

        plan.setSatisfactionFeedback(feedback);
        return surveillancePlanRepository.save(plan);
    }

    /**
     * Obtenir le résumé du certificat et plan de surveillance
     */
    public Map<String, Object> getCertificateWithSurveillanceInfo(Long requestId) {
        Map<String, Object> result = new HashMap<>();

        AccreditationRequest request = getRequestOrThrow(requestId);
        result.put("request", request);

        certificateRepository.findByRequest_Id(requestId).ifPresent(cert -> {
            result.put("certificate", cert);
            surveillancePlanRepository.findByCertificate_Id(cert.getId()).ifPresent(plan -> {
                result.put("surveillancePlan", plan);
            });
        });

        casDecisionRepository.findFirstByRequest_IdOrderByCreatedAtDesc(requestId).ifPresent(decision -> {
            result.put("latestDecision", decision);
        });

        return result;
    }

    /**
     * Traitement du refus — envoi des documents de notification avec droit de recours
     */
    @Transactional
    public AccreditationRequest processRefusal(Long requestId, String refusalDocuments,
            String appealInstructions, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        request.setCurrentStep("Refus notifié avec droit de recours");
        request.setNextAction("OEC peut exercer son droit de recours");
        request.setPendingWith("OEC (recours éventuel)");
        requestRepository.save(request);

        // Notification détaillée avec documents de recours
        notificationService.createNotification(
            request.getOec().getId(),
            "Notification de refus d'accréditation",
            String.format("Votre demande %s a été refusée. %s\n\nDroit de recours: %s",
                request.getReferenceNumber(), refusalDocuments, appealInstructions),
            "error"
        );

        log.info("Refus notifié pour {} avec instructions de recours", request.getReferenceNumber());
        return request;
    }

    /**
     * Traitement de l'ajournement — notification et suivi
     */
    @Transactional
    public AccreditationRequest processPostponement(Long requestId,
            String additionalRequirements, LocalDateTime nextPresentationDate,
            User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        request.setCurrentStep("Décision ajournée - Informations complémentaires requises");
        request.setNextAction(String.format("Fournir informations avant le %s",
            nextPresentationDate != null ? nextPresentationDate.toLocalDate() : "la prochaine session"));
        request.setPendingWith("RA / OEC");
        requestRepository.save(request);

        // Mettre à jour la décision
        casDecisionRepository.findFirstByRequest_IdOrderByCreatedAtDesc(requestId).ifPresent(decision -> {
            decision.setAdditionalRequirements(additionalRequirements);
            decision.setNextPresentationDate(nextPresentationDate);
            casDecisionRepository.save(decision);
        });

        log.info("Ajournement traité pour {}, prochaine présentation: {}", request.getReferenceNumber(), nextPresentationDate);
        return request;
    }

    // ========== PRIVATE HELPERS ==========

    private AccreditationRequest getRequestOrThrow(Long requestId) {
        return requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée: " + requestId));
    }

    private EvaluationReport getReportOrThrow(Long reportId) {
        return reportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Rapport non trouvé: " + reportId));
    }

    private void notifyRoleUsers(UserRole role, String title, String message, String type) {
        List<User> users = userRepository.findByRole(role);
        for (User user : users) {
            notificationService.createNotification(user.getId(), title, message, type);
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
