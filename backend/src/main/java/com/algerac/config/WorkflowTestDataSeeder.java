package com.algerac.config;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Seeds comprehensive PRO 12 workflow test data covering all phases.
 * Creates 10 accreditation requests at various stages with complete
 * entity chains (feasibility, quotation, convention, teams, doc review,
 * evaluation, gaps, reports, CAS decisions, certificates, surveillance).
 *
 * Idempotent: only seeds if reference numbers don't already exist.
 * Runs after seed-data.sql (which creates users).
 */
@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class WorkflowTestDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final FeasibilityStudyRepository feasibilityStudyRepository;
    private final QuotationRepository quotationRepository;
    private final ConventionRepository conventionRepository;
    private final PaymentRepository paymentRepository;
    private final EvaluationTeamRepository evaluationTeamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final DocumentaryReviewRepository documentaryReviewRepository;
    private final EvaluationPlanRepository evaluationPlanRepository;
    private final MandateRepository mandateRepository;
    private final MissionOrderRepository missionOrderRepository;
    private final GapRepository gapRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final EvaluationReportRepository evaluationReportRepository;
    private final CASMeetingRepository casMeetingRepository;
    private final CASVoteRepository casVoteRepository;
    private final CASDecisionRepository casDecisionRepository;
    private final AccreditationCertificateRepository certificateRepository;
    private final SurveillancePlanRepository surveillancePlanRepository;
    private final DocumentRepository documentRepository;
    private final NotificationRepository notificationRepository;

    // Cached users (loaded once)
    private User oec1, oec2, oec3, oec4, oec5;
    private User ra1, ra2, ra3;
    private User cd1, cd2;
    private User dag, dt, dg;
    private User ree1, ree2;
    private User et1, et2, et3;
    private User eq1;
    private User exp1, exp2;
    private User casPresident, casMember1, casMember2, casMember3;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (requestRepository.existsByReferenceNumber("D-2025-001")) {
            log.info("WorkflowTestDataSeeder: test data already exists, skipping.");
            return;
        }

        log.info("WorkflowTestDataSeeder: seeding comprehensive PRO 12 workflow data...");

        if (!loadUsers()) {
            log.warn("WorkflowTestDataSeeder: required users not found, skipping.");
            return;
        }

        try {
            seedRequest01_Active();
            seedRequest02_CASDecisionGrant();
            seedRequest03_ReportValidation();
            seedRequest04_EvaluationInProgress();
            seedRequest05_DocReviewInProgress();
            seedRequest06_TeamSentToOEC();
            seedRequest07_QuotationSentToOEC();
            seedRequest08_ReceivabilityStudy();
            seedRequest09_AwaitingActionPlans();
            seedRequest10_SurveillanceScheduled();

            log.info("WorkflowTestDataSeeder: successfully seeded 10 workflow test requests.");
        } catch (Exception e) {
            log.error("WorkflowTestDataSeeder: error seeding data - {}", e.getMessage(), e);
        }
    }

    private boolean loadUsers() {
        oec1 = findUser("oec.test@algeractestapp.dz");
        oec2 = findUser("oec.labo1@algeractestapp.dz");
        oec3 = findUser("oec.inspect1@algeractestapp.dz");
        oec4 = findUser("oec.certif1@algeractestapp.dz");
        oec5 = findUser("oec.calibration1@algeractestapp.dz");

        ra1 = findUser("ra.d1.01@algeractestapp.dz");
        ra2 = findUser("ra.d2.01@algeractestapp.dz");
        ra3 = findUser("ra.d3.01@algeractestapp.dz");

        cd1 = findUser("cd.domaine1@algeractestapp.dz");
        cd2 = findUser("cd.domaine2@algeractestapp.dz");

        dag = findUser("dag@algeractestapp.dz");
        dt = findUser("dt@algeractestapp.dz");
        dg = findUser("dg@algeractestapp.dz");

        ree1 = findUser("ree1@algeractestapp.dz");
        ree2 = findUser("ree2@algeractestapp.dz");

        et1 = findUser("et1@algeractestapp.dz");
        et2 = findUser("et2@algeractestapp.dz");
        et3 = findUser("et3@algeractestapp.dz");

        eq1 = findUser("cd.domaine1@algeractestapp.dz"); // CD with EQ role

        exp1 = findUser("exp1@algeractestapp.dz");
        exp2 = findUser("exp2@algeractestapp.dz");

        casPresident = findUser("cas.president@algeractestapp.dz");
        casMember1 = findUser("cas.member1@algeractestapp.dz");
        casMember2 = findUser("cas.member2@algeractestapp.dz");
        casMember3 = findUser("cas.member3@algeractestapp.dz");

        // Must have at minimum oec1, ra1, cd1
        return oec1 != null && ra1 != null && cd1 != null;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    // ============================================================
    // REQUEST 1: ACTIVE - Full lifecycle completed
    // Laboratoire d'Essais - ISO/IEC 17025
    // ============================================================
    private void seedRequest01_Active() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(8);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-001")
                .oec(oec1)
                .assignedToRa(ra1)
                .type(RequestType.INITIAL)
                .domain("Laboratoire d'Essais - Matériaux de Construction")
                .description("Accréditation initiale ISO/IEC 17025 pour essais sur matériaux de construction: béton, ciment, granulats, acier.")
                .status(RequestStatus.ACTIVE)
                .progress(100)
                .submissionDate(baseDate)
                .assignmentDate(baseDate.plusDays(3))
                .receivabilityDecisionDate(baseDate.plusDays(15))
                .isReceivable(true)
                .evaluationStartDate(baseDate.plusMonths(3))
                .evaluationEndDate(baseDate.plusMonths(3).plusDays(5))
                .casDecisionDate(baseDate.plusMonths(5))
                .certificateIssueDate(baseDate.plusMonths(5).plusDays(15))
                .certificateExpirationDate(baseDate.plusMonths(5).plusDays(15).plusYears(4))
                .currentPhase("SURVEILLANCE")
                .currentStep("surveillance_scheduled")
                .nextAction("Prochaine évaluation de surveillance prévue")
                .pendingWith("ALGERAC")
                .createdAt(baseDate)
                .build());

        // Feasibility study
        feasibilityStudyRepository.save(FeasibilityStudy.builder()
                .request(req)
                .responsableAccreditation(ra1)
                .decision(FeasibilityDecision.RECEIVABLE)
                .comments("Dossier complet. Laboratoire dispose des équipements nécessaires et du personnel qualifié.")
                .technicalAnalysis("Domaine couvert par ALGERAC. Normes applicables: NF EN 12390, NF EN 196, NF EN 12620.")
                .complianceCheck("Manuel qualité conforme. Procédures d'essais documentées. Personnel formé.")
                .studyStartDate(baseDate.plusDays(5))
                .studyCompletionDate(baseDate.plusDays(12))
                .createdAt(baseDate.plusDays(5))
                .build());

        // Registration fee payment
        paymentRepository.save(Payment.builder()
                .request(req)
                .amount(new BigDecimal("50000.00"))
                .paymentType("REGISTRATION_FEE")
                .status(PaymentStatus.COMPLETED)
                .paymentMethod("BANK_TRANSFER")
                .transactionId("PAY-2025-001-REG")
                .paymentDate(baseDate.plusDays(7))
                .dagValidated(true)
                .dagValidatedDate(baseDate.plusDays(8))
                .createdAt(baseDate.plusDays(7))
                .build());

        // Quotation
        Quotation quotation = quotationRepository.save(Quotation.builder()
                .request(req)
                .quotationNumber("DEV-2025-001")
                .preparedByRa(ra1)
                .approvedByDag(dag)
                .status(QuotationStatus.VALIDATED_BY_OEC)
                .amount(new BigDecimal("350000.00"))
                .details("Évaluation initiale: 5 jours sur site. Équipe: 1 REE + 2 ET + 1 EQ. Frais déplacement inclus.")
                .dagComments("Montant conforme au barème. Approuvé.")
                .reeCount(1).etCount(2).eqCount(1).obsCount(0).supCount(0).expCount(0)
                .evaluationDurationDays(5.0)
                .reeDurationDays(5.0).etDurationDays(5.0).eqDurationDays(3.0)
                .sentToDagDate(baseDate.plusDays(20))
                .approvedByDagDate(baseDate.plusDays(22))
                .sentToOecDate(baseDate.plusDays(23))
                .validatedByOecDate(baseDate.plusDays(28))
                .createdAt(baseDate.plusDays(18))
                .build());

        // Convention
        conventionRepository.save(Convention.builder()
                .request(req)
                .conventionNumber("CONV-2025-001")
                .preparedByRa(ra1)
                .status(ConventionStatus.VALIDATED_BY_OEC)
                .content("Convention d'accréditation entre ALGERAC et Laboratoire Essais MC. Portée: essais matériaux de construction.")
                .termsAndConditions("L'OEC s'engage à maintenir son système de management conforme aux exigences ISO/IEC 17025.")
                .sentToOecDate(baseDate.plusDays(23))
                .validatedByOecDate(baseDate.plusDays(28))
                .createdAt(baseDate.plusDays(18))
                .build());

        // Evaluation fee payment
        paymentRepository.save(Payment.builder()
                .request(req)
                .amount(new BigDecimal("350000.00"))
                .paymentType("EVALUATION_FEE")
                .status(PaymentStatus.COMPLETED)
                .paymentMethod("BANK_TRANSFER")
                .transactionId("PAY-2025-001-EVAL")
                .paymentDate(baseDate.plusDays(30))
                .dagValidated(true)
                .dagValidatedDate(baseDate.plusDays(31))
                .createdAt(baseDate.plusDays(30))
                .build());

        // Evaluation Team
        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req)
                .teamCode("EQ-2025-001")
                .proposedEvaluationDate(baseDate.plusMonths(3).toLocalDate())
                .evaluationDateAccepted(true)
                .oecValidated(true)
                .hasRecusation(false)
                .finalValidationDate(baseDate.plusMonths(2))
                .sentToOEC(baseDate.plusMonths(1).plusDays(20))
                .oecResponseDeadline(baseDate.plusMonths(1).plusDays(23))
                .status(TeamStatus.ACTIVE)
                .compositionSheetFOR26("FOR 26 - Fiche de composition d'équipe validée")
                .createdAt(baseDate.plusMonths(1).plusDays(10))
                .build());

        TeamMember reeM = saveMember(team, ree1, TeamRole.REE, "Essais matériaux", true, true);
        TeamMember etM1 = saveMember(team, et1, TeamRole.ET, "Béton et ciment", true, true);
        TeamMember etM2 = saveMember(team, et2, TeamRole.ET, "Granulats et acier", true, true);
        TeamMember eqM = saveMember(team, safe(eq1, ra1), TeamRole.EQ, "Système management qualité", true, true);

        // Mandates
        saveMandate(req, reeM, MandateStatus.SENT_TO_MEMBERS, baseDate.plusMonths(2).plusDays(5));
        saveMandate(req, etM1, MandateStatus.SENT_TO_MEMBERS, baseDate.plusMonths(2).plusDays(5));
        saveMandate(req, etM2, MandateStatus.SENT_TO_MEMBERS, baseDate.plusMonths(2).plusDays(5));
        saveMandate(req, eqM, MandateStatus.SENT_TO_MEMBERS, baseDate.plusMonths(2).plusDays(5));

        // Mission orders
        saveMissionOrder(req, ree1, "OM-2025-001-R", MissionOrderStatus.COMPLETED, baseDate.plusMonths(2).plusDays(10));
        saveMissionOrder(req, et1, "OM-2025-001-E1", MissionOrderStatus.COMPLETED, baseDate.plusMonths(2).plusDays(10));
        saveMissionOrder(req, et2, "OM-2025-001-E2", MissionOrderStatus.COMPLETED, baseDate.plusMonths(2).plusDays(10));
        saveMissionOrder(req, safe(eq1, ra1), "OM-2025-001-Q", MissionOrderStatus.COMPLETED, baseDate.plusMonths(2).plusDays(10));

        // Documentary review
        documentaryReviewRepository.save(DocumentaryReview.builder()
                .request(req)
                .team(team)
                .documentationSentToTeam(baseDate.plusMonths(2).plusDays(15))
                .reviewStartDate(baseDate.plusMonths(2).plusDays(15))
                .reviewCompletionDate(baseDate.plusMonths(2).plusDays(28))
                .teamResults("Revue documentaire satisfaisante. Quelques corrections mineures identifiées.")
                .resultsSentToCd(baseDate.plusMonths(2).plusDays(29))
                .cdSynthesis("Conformité documentaire acceptable. Procéder à l'évaluation.")
                .resultsSentToOEC(baseDate.plusMonths(2).plusDays(30))
                .oecRespondedInTime(true)
                .oecResponse("Corrections apportées au manuel qualité.")
                .responseAccepted(true)
                .cdFinalDecision("CONTINUE")
                .deficienciesIdentified(false)
                .status(DocumentaryReviewStatus.CD_DECISION_CONTINUE)
                .createdAt(baseDate.plusMonths(2).plusDays(15))
                .build());

        // Evaluation plan
        evaluationPlanRepository.save(EvaluationPlan.builder()
                .request(req)
                .team(team)
                .planCode("PLAN-2025-001")
                .planFOR32("FOR 32 - Plan d'évaluation détaillé sur 5 jours")
                .dailyProgram("J1: Réunion d'ouverture + Revue management. J2: Essais béton. J3: Essais ciment/granulats. J4: Essais acier. J5: Consensus + Réunion de clôture.")
                .activityDistribution("REE: coordination générale. ET1: essais béton/ciment. ET2: essais granulats/acier. EQ: système qualité.")
                .documentsToExamine("Manuel qualité, procédures d'essais, enregistrements, certificats d'étalonnage")
                .evaluationDate(baseDate.plusMonths(3))
                .validatedByCD(true)
                .cdValidationDate(baseDate.plusMonths(2).plusDays(25))
                .sentToOEC(baseDate.plusMonths(2).plusDays(27))
                .status(EvaluationPlanStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(2).plusDays(20))
                .build());

        // Gaps (2 non-critical, both resolved)
        Gap gap1 = gapRepository.save(Gap.builder()
                .request(req).createdBy(et1).gapCode("EC-2025-001-01")
                .type(GapType.NON_CRITIQUE)
                .description("Procédure d'essai PE-BET-03 non mise à jour suite à la dernière révision normative NF EN 12390-3.")
                .requirement("ISO/IEC 17025 §7.2.1 - Sélection, vérification et validation des méthodes")
                .evidence("Version 2 de PE-BET-03 datée de 2022, norme révisée en 2024.")
                .identifiedDate(baseDate.plusMonths(3).plusDays(4))
                .FOR02Content("FOR 02 - Fiche d'écart: PE-BET-03 non conforme à NF EN 12390-3:2024")
                .status(GapStatus.RESOLVED)
                .sentToREE(true).sentToREEDate(baseDate.plusMonths(3).plusDays(4))
                .keptByREE(true)
                .sentToOEC(true).sentToOECDate(baseDate.plusMonths(3).plusDays(5))
                .oecAccepted(true).oecResponseDate(baseDate.plusMonths(3).plusDays(6))
                .createdAt(baseDate.plusMonths(3).plusDays(4))
                .build());

        actionPlanRepository.save(ActionPlan.builder()
                .gap(gap1)
                .correctiveActions("Mise à jour de PE-BET-03 selon NF EN 12390-3:2024. Formation du personnel.")
                .preventiveActions("Mise en place d'une veille normative trimestrielle.")
                .responsiblePerson("Chef de laboratoire")
                .implementationDeadline(baseDate.plusMonths(3).plusDays(15))
                .submittedByOEC(baseDate.plusMonths(3).plusDays(8))
                .submittedInTime(true)
                .evaluatedByTeam(baseDate.plusMonths(3).plusDays(12))
                .acceptedByTeam(true)
                .teamFeedback("Plan d'action pertinent et complet.")
                .implementationCompletedDate(baseDate.plusMonths(3).plusDays(14))
                .implementationEvidence("PE-BET-03 v3 mise à jour. Attestations de formation.")
                .evidenceSatisfactory(true)
                .status(ActionPlanStatus.COMPLETED)
                .createdAt(baseDate.plusMonths(3).plusDays(7))
                .build());

        Gap gap2 = gapRepository.save(Gap.builder()
                .request(req).createdBy(safe(eq1, ra1)).gapCode("EC-2025-001-02")
                .type(GapType.NON_CRITIQUE)
                .description("Enregistrement d'étalonnage du dynamomètre DYN-003 incomplet.")
                .requirement("ISO/IEC 17025 §6.4.6 - Étalonnage")
                .evidence("Certificat d'étalonnage ne couvre pas la plage 500-1000 kN.")
                .identifiedDate(baseDate.plusMonths(3).plusDays(4))
                .FOR02Content("FOR 02 - Étalonnage incomplet DYN-003")
                .status(GapStatus.RESOLVED)
                .sentToREE(true).sentToREEDate(baseDate.plusMonths(3).plusDays(4))
                .keptByREE(true)
                .sentToOEC(true).sentToOECDate(baseDate.plusMonths(3).plusDays(5))
                .oecAccepted(true).oecResponseDate(baseDate.plusMonths(3).plusDays(6))
                .createdAt(baseDate.plusMonths(3).plusDays(4))
                .build());

        actionPlanRepository.save(ActionPlan.builder()
                .gap(gap2)
                .correctiveActions("Ré-étalonnage du DYN-003 sur toute la plage 0-1000 kN chez organisme accrédité.")
                .responsiblePerson("Responsable métrologie")
                .implementationDeadline(baseDate.plusMonths(3).plusDays(20))
                .submittedByOEC(baseDate.plusMonths(3).plusDays(9))
                .submittedInTime(true)
                .evaluatedByTeam(baseDate.plusMonths(3).plusDays(13))
                .acceptedByTeam(true)
                .implementationCompletedDate(baseDate.plusMonths(3).plusDays(18))
                .implementationEvidence("Nouveau certificat d'étalonnage COFRAC couvrant 0-1000 kN.")
                .evidenceSatisfactory(true)
                .status(ActionPlanStatus.COMPLETED)
                .createdAt(baseDate.plusMonths(3).plusDays(8))
                .build());

        // Evaluation report
        EvaluationReport report = evaluationReportRepository.save(EvaluationReport.builder()
                .request(req).team(team).reportNumber("RAP-2025-001")
                .type(ReportType.FOR_09_LABORATORY)
                .contextAndObjectives("Évaluation initiale ISO/IEC 17025 - Laboratoire essais matériaux de construction")
                .teamComposition("REE: " + ree1.getFullName() + ", ET1: " + et1.getFullName() + ", ET2: " + et2.getFullName())
                .programRealized("Évaluation réalisée du " + baseDate.plusMonths(3).toLocalDate() + " au " + baseDate.plusMonths(3).plusDays(5).toLocalDate())
                .findingsByRequirement("§4: Conforme. §5: Conforme. §6: 1 écart mineur (étalonnage). §7: 1 écart mineur (procédure).")
                .gapsSummary("2 écarts non critiques identifiés, tous résolus dans les délais.")
                .gapsStatus("Tous les écarts sont soldés.")
                .strengths("Personnel très compétent. Équipements modernes. Bonne traçabilité des résultats.")
                .improvementAreas("Veille normative à systématiser. Audit interne à renforcer.")
                .conclusionAndRecommendation("RECOMMANDATION FAVORABLE pour l'octroi de l'accréditation.")
                .evaluationClosureDate(baseDate.plusMonths(3).plusDays(5))
                .draftedByREE(baseDate.plusMonths(3).plusDays(20))
                .submittedToCD(baseDate.plusMonths(3).plusDays(25))
                .validatedByCD(true)
                .validationDate(baseDate.plusMonths(4))
                .FOR23AppreciationSheet("FOR 23 - Appréciation: Évaluation menée conformément aux procédures. Rapport complet.")
                .status(EvaluationReportStatus.VALIDATED)
                .createdAt(baseDate.plusMonths(3).plusDays(20))
                .build());

        // CAS Meeting + Votes + Decision
        CASMeeting meeting = casMeetingRepository.save(CASMeeting.builder()
                .request(req)
                .meetingCode("CAS-2025-001")
                .meetingDate(baseDate.plusMonths(5))
                .location("Siège ALGERAC - Salle CAS")
                .agenda("Examen du dossier D-2025-001 - Laboratoire Essais Matériaux de Construction")
                .dossierSummary("Dossier complet. 2 écarts non critiques résolus. Recommandation favorable du REE.")
                .status(CASMeetingStatus.DECIDED)
                .finalDecision("GRANT_FULL")
                .presidentNotes("Dossier exemplaire. Accréditation accordée à l'unanimité.")
                .summonsSentAt(baseDate.plusMonths(4).plusDays(15))
                .dossierSentAt(baseDate.plusMonths(4).plusDays(20))
                .quorumRequired(3)
                .attendeesConfirmed(4)
                .quorumReached(true)
                .votingOpenedAt(baseDate.plusMonths(5))
                .votingClosedAt(baseDate.plusMonths(5).plusHours(2))
                .decidedAt(baseDate.plusMonths(5).plusHours(3))
                .for15DecisionJustification("Conformité démontrée. Compétence technique validée.")
                .for15ScopeDecision("Portée complète accordée.")
                .for15AppealRightsNotice("L'OEC dispose de 30 jours pour exercer un recours.")
                .createdAt(baseDate.plusMonths(4).plusDays(10))
                .build());

        if (casPresident != null) {
            saveCASVote(meeting, casPresident, "ACCORDER", "Dossier conforme, recommandation favorable.");
        }
        if (casMember1 != null) {
            saveCASVote(meeting, casMember1, "ACCORDER", "Compétence technique démontrée.");
        }
        if (casMember2 != null) {
            saveCASVote(meeting, casMember2, "ACCORDER", "Système qualité conforme.");
        }
        if (casMember3 != null) {
            saveCASVote(meeting, casMember3, "ACCORDER", "Favorable.");
        }

        CASDecision decision = casDecisionRepository.save(CASDecision.builder()
                .request(req).report(report)
                .decisionNumber("DEC-CAS-2025-001")
                .decisionType(CASDecisionType.GRANT_FULL)
                .meetingDate(baseDate.plusMonths(5))
                .justification("L'OEC a démontré sa conformité aux exigences ISO/IEC 17025.")
                .scope("Essais sur matériaux de construction: béton, ciment, granulats, acier selon normes NF EN.")
                .appealRightNotified(true)
                .createdAt(baseDate.plusMonths(5))
                .build());

        // Certificate
        AccreditationCertificate cert = certificateRepository.save(AccreditationCertificate.builder()
                .request(req).casDecision(decision)
                .certificateNumber("CERT-ALGERAC-2025-001")
                .issueDate(baseDate.plusMonths(5).plusDays(15))
                .expirationDate(baseDate.plusMonths(5).plusDays(15).plusYears(4))
                .oecIdentity("Laboratoire d'Essais Matériaux de Construction - " + oec1.getFullName())
                .scope("Essais sur béton (NF EN 12390), ciment (NF EN 196), granulats (NF EN 12620), acier de construction")
                .technicalDomains("Essais physiques et mécaniques sur matériaux de construction")
                .methodsAndStandards("NF EN 12390-1 à 12390-14, NF EN 196-1 à 196-10, NF EN 12620, NF EN 10002")
                .accreditationStandardReference("ISO/IEC 17025:2017")
                .signedByDG(true).signedByDT(true).published(true)
                .createdAt(baseDate.plusMonths(5).plusDays(15))
                .build());

        // Surveillance plan
        surveillancePlanRepository.save(SurveillancePlan.builder()
                .certificate(cert)
                .planCode("SURV-2025-001")
                .surveillanceCalendar("Évaluations de surveillance annuelles: S1 en mois 12, S2 en mois 24, S3 en mois 36")
                .frequency("Annuelle")
                .scopeSampling("Rotation des domaines d'essais: S1=béton+ciment, S2=granulats+acier, S3=complet")
                .estimatedDurationPerEvaluation(3)
                .nextSurveillanceDate(baseDate.plusMonths(5).plusDays(15).plusYears(1))
                .satisfactionFormFOR22Sent(true)
                .satisfactionFeedback("Satisfait du processus d'accréditation. Délais respectés.")
                .createdAt(baseDate.plusMonths(5).plusDays(20))
                .build());

        // Documents
        seedDocuments(req, oec1, baseDate);

        log.info("  ✓ D-2025-001: ACTIVE (full lifecycle)");
    }

    // ============================================================
    // REQUEST 2: CAS_DECISION_GRANT - Awaiting certificate
    // Organisme d'Inspection - ISO/IEC 17020
    // ============================================================
    private void seedRequest02_CASDecisionGrant() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(6);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-002")
                .oec(safe(oec2, oec1)).assignedToRa(safe(ra2, ra1))
                .type(RequestType.INITIAL)
                .domain("Organisme d'Inspection - Équipements sous Pression")
                .description("Accréditation initiale ISO/IEC 17020 type A pour inspection d'équipements sous pression.")
                .status(RequestStatus.CAS_DECISION_GRANT)
                .progress(92)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(2))
                .receivabilityDecisionDate(baseDate.plusDays(10)).isReceivable(true)
                .evaluationStartDate(baseDate.plusMonths(3))
                .evaluationEndDate(baseDate.plusMonths(3).plusDays(4))
                .casDecisionDate(baseDate.plusMonths(5))
                .currentPhase("POST_DECISION")
                .currentStep("certificate_preparation")
                .nextAction("Préparer le certificat d'accréditation")
                .pendingWith("DT/DG")
                .createdAt(baseDate)
                .build());

        feasibilityStudyRepository.save(FeasibilityStudy.builder()
                .request(req).responsableAccreditation(safe(ra2, ra1))
                .decision(FeasibilityDecision.RECEIVABLE)
                .comments("Dossier recevable. Organisme dispose de l'indépendance requise (type A).")
                .technicalAnalysis("Domaine couvert. Personnel qualifié en inspection sous pression.")
                .studyStartDate(baseDate.plusDays(3)).studyCompletionDate(baseDate.plusDays(8))
                .createdAt(baseDate.plusDays(3))
                .build());

        quotationRepository.save(Quotation.builder()
                .request(req).quotationNumber("DEV-2025-002")
                .preparedByRa(safe(ra2, ra1)).approvedByDag(dag)
                .status(QuotationStatus.VALIDATED_BY_OEC)
                .amount(new BigDecimal("420000.00"))
                .details("Évaluation initiale: 4 jours. 1 REE + 2 ET + 1 Expert.")
                .reeCount(1).etCount(2).eqCount(0).expCount(1)
                .evaluationDurationDays(4.0)
                .sentToDagDate(baseDate.plusDays(18)).approvedByDagDate(baseDate.plusDays(20))
                .sentToOecDate(baseDate.plusDays(21)).validatedByOecDate(baseDate.plusDays(26))
                .createdAt(baseDate.plusDays(15))
                .build());

        conventionRepository.save(Convention.builder()
                .request(req).conventionNumber("CONV-2025-002")
                .preparedByRa(safe(ra2, ra1))
                .status(ConventionStatus.VALIDATED_BY_OEC)
                .sentToOecDate(baseDate.plusDays(21)).validatedByOecDate(baseDate.plusDays(26))
                .createdAt(baseDate.plusDays(15))
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-002")
                .proposedEvaluationDate(baseDate.plusMonths(3).toLocalDate())
                .evaluationDateAccepted(true).oecValidated(true).hasRecusation(false)
                .finalValidationDate(baseDate.plusMonths(2))
                .status(TeamStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(1).plusDays(5))
                .build());

        saveMember(team, safe(ree2, ree1), TeamRole.REE, "Inspection équipements", true, true);
        saveMember(team, et1, TeamRole.ET, "Équipements sous pression", true, true);
        saveMember(team, safe(et3, et2), TeamRole.ET, "Réglementation industrielle", true, true);
        if (exp1 != null) saveMember(team, exp1, TeamRole.EXP, "Expertise pression/soudure", true, true);

        EvaluationReport report = evaluationReportRepository.save(EvaluationReport.builder()
                .request(req).team(team).reportNumber("RAP-2025-002")
                .type(ReportType.FOR_08_INSPECTION)
                .conclusionAndRecommendation("RECOMMANDATION FAVORABLE - Portée complète demandée.")
                .gapsSummary("1 écart non critique résolu.")
                .status(EvaluationReportStatus.VALIDATED)
                .evaluationClosureDate(baseDate.plusMonths(3).plusDays(4))
                .draftedByREE(baseDate.plusMonths(3).plusDays(15))
                .validatedByCD(true).validationDate(baseDate.plusMonths(4))
                .createdAt(baseDate.plusMonths(3).plusDays(15))
                .build());

        CASMeeting meeting = casMeetingRepository.save(CASMeeting.builder()
                .request(req).meetingCode("CAS-2025-002")
                .meetingDate(baseDate.plusMonths(5))
                .status(CASMeetingStatus.DECIDED)
                .finalDecision("GRANT_FULL")
                .quorumRequired(3).attendeesConfirmed(4).quorumReached(true)
                .decidedAt(baseDate.plusMonths(5))
                .createdAt(baseDate.plusMonths(4).plusDays(10))
                .build());

        casDecisionRepository.save(CASDecision.builder()
                .request(req).report(report).decisionNumber("DEC-CAS-2025-002")
                .decisionType(CASDecisionType.GRANT_FULL)
                .meetingDate(baseDate.plusMonths(5))
                .justification("Conformité ISO/IEC 17020 démontrée.")
                .scope("Inspection d'équipements sous pression - Type A")
                .appealRightNotified(true)
                .createdAt(baseDate.plusMonths(5))
                .build());

        log.info("  ✓ D-2025-002: CAS_DECISION_GRANT");
    }

    // ============================================================
    // REQUEST 3: REPORT_VALIDATION - Report submitted to CD
    // Laboratoire Médical - ISO 15189
    // ============================================================
    private void seedRequest03_ReportValidation() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(5);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-003")
                .oec(safe(oec3, oec1)).assignedToRa(ra1)
                .type(RequestType.INITIAL)
                .domain("Laboratoire de Biologie Médicale")
                .description("Accréditation initiale ISO 15189 pour analyses biochimiques et hématologiques.")
                .status(RequestStatus.REPORT_VALIDATION)
                .progress(80)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(3))
                .receivabilityDecisionDate(baseDate.plusDays(12)).isReceivable(true)
                .evaluationStartDate(baseDate.plusMonths(3))
                .evaluationEndDate(baseDate.plusMonths(3).plusDays(4))
                .currentPhase("RAPPORT")
                .currentStep("report_validation")
                .nextAction("CD doit valider le rapport d'évaluation")
                .pendingWith("CD")
                .createdAt(baseDate)
                .build());

        feasibilityStudyRepository.save(FeasibilityStudy.builder()
                .request(req).responsableAccreditation(ra1)
                .decision(FeasibilityDecision.RECEIVABLE)
                .comments("Dossier recevable pour accréditation ISO 15189.")
                .studyStartDate(baseDate.plusDays(4)).studyCompletionDate(baseDate.plusDays(10))
                .createdAt(baseDate.plusDays(4))
                .build());

        quotationRepository.save(Quotation.builder()
                .request(req).quotationNumber("DEV-2025-003")
                .preparedByRa(ra1).status(QuotationStatus.VALIDATED_BY_OEC)
                .amount(new BigDecimal("500000.00")).reeCount(1).etCount(2).eqCount(1)
                .evaluationDurationDays(5.0)
                .validatedByOecDate(baseDate.plusDays(30))
                .createdAt(baseDate.plusDays(15))
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-003")
                .proposedEvaluationDate(baseDate.plusMonths(3).toLocalDate())
                .evaluationDateAccepted(true).oecValidated(true)
                .status(TeamStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(1).plusDays(5))
                .build());

        saveMember(team, ree1, TeamRole.REE, "Biologie médicale", true, true);
        saveMember(team, et1, TeamRole.ET, "Biochimie", true, true);
        saveMember(team, et2, TeamRole.ET, "Hématologie", true, true);

        // Report awaiting CD validation
        evaluationReportRepository.save(EvaluationReport.builder()
                .request(req).team(team).reportNumber("RAP-2025-003")
                .type(ReportType.FOR_09_1_BIOMEDICAL)
                .conclusionAndRecommendation("RECOMMANDATION FAVORABLE avec observations mineures.")
                .gapsSummary("3 écarts non critiques, tous résolus.")
                .strengths("Compétence du personnel. Participation aux EEQ satisfaisante.")
                .improvementAreas("Documentation pré-analytique à renforcer.")
                .evaluationClosureDate(baseDate.plusMonths(3).plusDays(4))
                .draftedByREE(baseDate.plusMonths(3).plusDays(25))
                .submittedToCD(baseDate.plusMonths(4))
                .status(EvaluationReportStatus.SUBMITTED_TO_CD)
                .createdAt(baseDate.plusMonths(3).plusDays(25))
                .build());

        log.info("  ✓ D-2025-003: REPORT_VALIDATION");
    }

    // ============================================================
    // REQUEST 4: EVALUATION_IN_PROGRESS - On site
    // Organisme de Certification - ISO/IEC 17065
    // ============================================================
    private void seedRequest04_EvaluationInProgress() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(4);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-004")
                .oec(safe(oec4, oec1)).assignedToRa(safe(ra3, ra1))
                .type(RequestType.INITIAL)
                .domain("Organisme de Certification de Produits")
                .description("Accréditation initiale ISO/IEC 17065 pour certification de produits agroalimentaires.")
                .status(RequestStatus.EVALUATION_IN_PROGRESS)
                .progress(60)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(2))
                .receivabilityDecisionDate(baseDate.plusDays(10)).isReceivable(true)
                .evaluationStartDate(LocalDateTime.now().minusDays(2))
                .currentPhase("EVALUATION")
                .currentStep("evaluation_ongoing")
                .nextAction("Évaluation sur site en cours")
                .pendingWith("EQUIPE")
                .createdAt(baseDate)
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-004")
                .proposedEvaluationDate(LocalDate.now().minusDays(2))
                .evaluationDateAccepted(true).oecValidated(true)
                .status(TeamStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(2))
                .build());

        saveMember(team, safe(ree2, ree1), TeamRole.REE, "Certification produits", true, true);
        saveMember(team, et1, TeamRole.ET, "Agroalimentaire", true, true);
        if (exp2 != null) saveMember(team, exp2, TeamRole.EXP, "Normes produits", true, true);

        evaluationPlanRepository.save(EvaluationPlan.builder()
                .request(req).team(team).planCode("PLAN-2025-004")
                .planFOR32("FOR 32 - Plan d'évaluation certification produits")
                .evaluationDate(LocalDateTime.now().minusDays(2))
                .validatedByCD(true)
                .sentToOEC(baseDate.plusMonths(3))
                .status(EvaluationPlanStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(2).plusDays(20))
                .build());

        log.info("  ✓ D-2025-004: EVALUATION_IN_PROGRESS");
    }

    // ============================================================
    // REQUEST 5: DOC_REVIEW_IN_PROGRESS - Documentary review
    // Laboratoire d'Étalonnage - ISO/IEC 17025
    // ============================================================
    private void seedRequest05_DocReviewInProgress() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(3);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-005")
                .oec(safe(oec5, oec1)).assignedToRa(ra1)
                .type(RequestType.INITIAL)
                .domain("Laboratoire d'Étalonnage - Métrologie")
                .description("Accréditation ISO/IEC 17025 pour étalonnage de masses, balances et instruments de pesage.")
                .status(RequestStatus.DOC_REVIEW_IN_PROGRESS)
                .progress(45)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(3))
                .receivabilityDecisionDate(baseDate.plusDays(12)).isReceivable(true)
                .currentPhase("REVUE_DOCUMENTAIRE")
                .currentStep("doc_review_analysis")
                .nextAction("Équipe analyse la documentation (15 jours)")
                .pendingWith("EQUIPE")
                .createdAt(baseDate)
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-005")
                .proposedEvaluationDate(LocalDate.now().plusMonths(1))
                .evaluationDateAccepted(true).oecValidated(true)
                .status(TeamStatus.VALIDATED)
                .createdAt(baseDate.plusMonths(1))
                .build());

        saveMember(team, ree1, TeamRole.REE, "Métrologie", true, true);
        saveMember(team, et2, TeamRole.ET, "Étalonnage masses", true, true);

        documentaryReviewRepository.save(DocumentaryReview.builder()
                .request(req).team(team)
                .documentationSentToTeam(LocalDateTime.now().minusDays(5))
                .reviewStartDate(LocalDateTime.now().minusDays(5))
                .teamResultsDeadline(LocalDateTime.now().plusDays(10))
                .status(DocumentaryReviewStatus.IN_PROGRESS)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build());

        log.info("  ✓ D-2025-005: DOC_REVIEW_IN_PROGRESS");
    }

    // ============================================================
    // REQUEST 6: TEAM_SENT_TO_OEC - Awaiting OEC validation
    // Laboratoire d'Essais - Électrique
    // ============================================================
    private void seedRequest06_TeamSentToOEC() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(2);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-006")
                .oec(oec1).assignedToRa(ra1)
                .type(RequestType.EXTENSION)
                .domain("Laboratoire d'Essais - Sécurité Électrique")
                .description("Extension de portée pour essais de sécurité électrique basse tension selon NF EN 60950.")
                .status(RequestStatus.TEAM_SENT_TO_OEC)
                .progress(35)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(2))
                .receivabilityDecisionDate(baseDate.plusDays(8)).isReceivable(true)
                .currentPhase("CONSTITUTION_EQUIPE")
                .currentStep("team_sent_to_oec")
                .nextAction("OEC doit valider la composition de l'équipe (3 jours)")
                .pendingWith("OEC")
                .createdAt(baseDate)
                .build());

        quotationRepository.save(Quotation.builder()
                .request(req).quotationNumber("DEV-2025-006")
                .preparedByRa(ra1).status(QuotationStatus.VALIDATED_BY_OEC)
                .amount(new BigDecimal("280000.00")).reeCount(1).etCount(1).eqCount(1)
                .evaluationDurationDays(3.0)
                .validatedByOecDate(baseDate.plusDays(25))
                .createdAt(baseDate.plusDays(12))
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-006")
                .proposedEvaluationDate(LocalDate.now().plusMonths(2))
                .sentToOEC(LocalDateTime.now().minusDays(1))
                .oecResponseDeadline(LocalDateTime.now().plusDays(2))
                .status(TeamStatus.SENT_TO_OEC)
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());

        saveMember(team, ree1, TeamRole.REE, "Essais électriques", true, true);
        saveMember(team, safe(et3, et1), TeamRole.ET, "Sécurité basse tension", true, true);
        saveMember(team, safe(eq1, ra1), TeamRole.EQ, "Système qualité", true, true);

        log.info("  ✓ D-2025-006: TEAM_SENT_TO_OEC");
    }

    // ============================================================
    // REQUEST 7: QUOTATION_SENT_TO_OEC - Contractualization
    // Organisme d'Inspection - Ascenseurs
    // ============================================================
    private void seedRequest07_QuotationSentToOEC() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(2);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-007")
                .oec(safe(oec3, oec1)).assignedToRa(safe(ra2, ra1))
                .type(RequestType.INITIAL)
                .domain("Organisme d'Inspection - Ascenseurs")
                .description("Accréditation ISO/IEC 17020 pour inspection périodique d'ascenseurs et monte-charges.")
                .status(RequestStatus.QUOTATION_SENT_TO_OEC)
                .progress(25)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(2))
                .receivabilityDecisionDate(baseDate.plusDays(10)).isReceivable(true)
                .currentPhase("CONTRACTUALISATION")
                .currentStep("quotation_sent_to_oec")
                .nextAction("OEC doit valider le devis (15 jours)")
                .pendingWith("OEC")
                .createdAt(baseDate)
                .build());

        quotationRepository.save(Quotation.builder()
                .request(req).quotationNumber("DEV-2025-007")
                .preparedByRa(safe(ra2, ra1)).approvedByDag(dag)
                .status(QuotationStatus.SENT_TO_OEC)
                .amount(new BigDecimal("380000.00"))
                .details("Évaluation initiale: 4 jours. 1 REE + 2 ET.")
                .reeCount(1).etCount(2)
                .evaluationDurationDays(4.0)
                .sentToDagDate(baseDate.plusDays(15)).approvedByDagDate(baseDate.plusDays(17))
                .sentToOecDate(LocalDateTime.now().minusDays(3))
                .createdAt(baseDate.plusDays(12))
                .build());

        conventionRepository.save(Convention.builder()
                .request(req).conventionNumber("CONV-2025-007")
                .preparedByRa(safe(ra2, ra1))
                .status(ConventionStatus.SENT_TO_OEC)
                .sentToOecDate(LocalDateTime.now().minusDays(3))
                .createdAt(baseDate.plusDays(12))
                .build());

        log.info("  ✓ D-2025-007: QUOTATION_SENT_TO_OEC");
    }

    // ============================================================
    // REQUEST 8: RECEIVABILITY_STUDY - Early stage
    // Lab d'Essais Chimiques
    // ============================================================
    private void seedRequest08_ReceivabilityStudy() {
        LocalDateTime baseDate = LocalDateTime.now().minusWeeks(2);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-008")
                .oec(safe(oec4, oec1)).assignedToRa(ra1)
                .type(RequestType.INITIAL)
                .domain("Laboratoire d'Essais - Chimie Analytique")
                .description("Accréditation ISO/IEC 17025 pour analyses chimiques: eaux, sols, produits alimentaires.")
                .status(RequestStatus.RECEIVABILITY_STUDY)
                .progress(10)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(2))
                .currentPhase("RECEVABILITE")
                .currentStep("receivability_study")
                .nextAction("RA étudie la recevabilité du dossier")
                .pendingWith("RA")
                .createdAt(baseDate)
                .build());

        feasibilityStudyRepository.save(FeasibilityStudy.builder()
                .request(req).responsableAccreditation(ra1)
                .decision(FeasibilityDecision.PENDING)
                .comments("Étude en cours. Vérification des documents.")
                .technicalAnalysis("Domaine couvert. Analyse des compétences en cours.")
                .studyStartDate(baseDate.plusDays(3))
                .createdAt(baseDate.plusDays(3))
                .build());

        // Registration fee paid
        paymentRepository.save(Payment.builder()
                .request(req)
                .amount(new BigDecimal("50000.00"))
                .paymentType("REGISTRATION_FEE")
                .status(PaymentStatus.COMPLETED)
                .paymentMethod("BANK_TRANSFER")
                .transactionId("PAY-2025-008-REG")
                .paymentDate(baseDate.plusDays(1))
                .dagValidated(true)
                .createdAt(baseDate.plusDays(1))
                .build());

        log.info("  ✓ D-2025-008: RECEIVABILITY_STUDY");
    }

    // ============================================================
    // REQUEST 9: AWAITING_ACTION_PLANS - Gap treatment
    // Lab Essais - Géotechnique
    // ============================================================
    private void seedRequest09_AwaitingActionPlans() {
        LocalDateTime baseDate = LocalDateTime.now().minusMonths(5);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-009")
                .oec(safe(oec2, oec1)).assignedToRa(ra1)
                .type(RequestType.INITIAL)
                .domain("Laboratoire d'Essais - Géotechnique")
                .description("Accréditation ISO/IEC 17025 pour essais géotechniques: sols, fondations, terrassements.")
                .status(RequestStatus.AWAITING_ACTION_PLANS)
                .progress(70)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(3))
                .receivabilityDecisionDate(baseDate.plusDays(12)).isReceivable(true)
                .evaluationStartDate(baseDate.plusMonths(3))
                .evaluationEndDate(baseDate.plusMonths(3).plusDays(4))
                .currentPhase("TRAITEMENT_ECARTS")
                .currentStep("awaiting_action_plans")
                .nextAction("OEC doit soumettre les plans d'action (10 jours)")
                .pendingWith("OEC")
                .createdAt(baseDate)
                .build());

        EvaluationTeam team = evaluationTeamRepository.save(EvaluationTeam.builder()
                .request(req).teamCode("EQ-2025-009")
                .proposedEvaluationDate(baseDate.plusMonths(3).toLocalDate())
                .evaluationDateAccepted(true).oecValidated(true)
                .status(TeamStatus.ACTIVE)
                .createdAt(baseDate.plusMonths(1).plusDays(10))
                .build());

        saveMember(team, ree1, TeamRole.REE, "Géotechnique", true, true);
        saveMember(team, et1, TeamRole.ET, "Sols et fondations", true, true);
        saveMember(team, et2, TeamRole.ET, "Terrassements", true, true);

        // Gap 1: CRITICAL - awaiting action plan
        Gap critGap = gapRepository.save(Gap.builder()
                .request(req).createdBy(et1).gapCode("EC-2025-009-01")
                .type(GapType.CRITIQUE)
                .description("Absence de traçabilité métrologique pour le pénétromètre dynamique PDL-01.")
                .requirement("ISO/IEC 17025 §6.4 - Équipements")
                .evidence("Aucun certificat d'étalonnage valide trouvé. Dernier étalonnage > 2 ans.")
                .identifiedDate(baseDate.plusMonths(3).plusDays(4))
                .FOR02Content("FOR 02 - Écart critique: PDL-01 sans traçabilité métrologique")
                .status(GapStatus.AWAITING_ACTION_PLAN)
                .sentToREE(true).sentToREEDate(baseDate.plusMonths(3).plusDays(4))
                .keptByREE(true)
                .sentToOEC(true).sentToOECDate(baseDate.plusMonths(3).plusDays(5))
                .oecAccepted(true).oecResponseDate(baseDate.plusMonths(3).plusDays(6))
                .createdAt(baseDate.plusMonths(3).plusDays(4))
                .build());

        // Gap 2: NON-CRITICAL - action plan submitted, under evaluation
        Gap ncGap = gapRepository.save(Gap.builder()
                .request(req).createdBy(et2).gapCode("EC-2025-009-02")
                .type(GapType.NON_CRITIQUE)
                .description("Procédure d'essai de compactage Proctor non conforme à NF P 94-093:2014.")
                .requirement("ISO/IEC 17025 §7.2.1 - Méthodes")
                .evidence("Procédure version 2019, norme révisée en 2014 non intégrée.")
                .identifiedDate(baseDate.plusMonths(3).plusDays(4))
                .FOR02Content("FOR 02 - Procédure compactage non à jour")
                .status(GapStatus.PLAN_SUBMITTED)
                .sentToREE(true).sentToREEDate(baseDate.plusMonths(3).plusDays(4))
                .keptByREE(true)
                .sentToOEC(true).sentToOECDate(baseDate.plusMonths(3).plusDays(5))
                .oecAccepted(true)
                .createdAt(baseDate.plusMonths(3).plusDays(4))
                .build());

        actionPlanRepository.save(ActionPlan.builder()
                .gap(ncGap)
                .correctiveActions("Mise à jour procédure selon NF P 94-093:2014. Revalidation de la méthode.")
                .responsiblePerson("Responsable technique")
                .implementationDeadline(LocalDateTime.now().plusDays(15))
                .submittedByOEC(LocalDateTime.now().minusDays(2))
                .submittedInTime(true)
                .status(ActionPlanStatus.UNDER_EVALUATION)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build());

        // Gap 3: NON-CRITICAL - resolved
        Gap resolved = gapRepository.save(Gap.builder()
                .request(req).createdBy(ree1).gapCode("EC-2025-009-03")
                .type(GapType.NON_CRITIQUE)
                .description("Enregistrement incomplet des conditions environnementales lors des essais.")
                .requirement("ISO/IEC 17025 §7.7 - Assurer la validité des résultats")
                .evidence("Registre température/humidité avec lacunes sur 3 mois.")
                .identifiedDate(baseDate.plusMonths(3).plusDays(3))
                .status(GapStatus.RESOLVED)
                .sentToREE(true).keptByREE(true)
                .sentToOEC(true).oecAccepted(true)
                .createdAt(baseDate.plusMonths(3).plusDays(3))
                .build());

        actionPlanRepository.save(ActionPlan.builder()
                .gap(resolved)
                .correctiveActions("Installation d'enregistreurs automatiques. Mise en place de contrôles journaliers.")
                .responsiblePerson("Technicien principal")
                .submittedByOEC(baseDate.plusMonths(3).plusDays(10))
                .submittedInTime(true)
                .acceptedByTeam(true).evaluatedByTeam(baseDate.plusMonths(3).plusDays(14))
                .implementationCompletedDate(baseDate.plusMonths(3).plusDays(20))
                .evidenceSatisfactory(true)
                .status(ActionPlanStatus.COMPLETED)
                .createdAt(baseDate.plusMonths(3).plusDays(9))
                .build());

        log.info("  ✓ D-2025-009: AWAITING_ACTION_PLANS");
    }

    // ============================================================
    // REQUEST 10: SURVEILLANCE_SCHEDULED - Post-accreditation
    // Lab Essais - Environnement
    // ============================================================
    private void seedRequest10_SurveillanceScheduled() {
        LocalDateTime baseDate = LocalDateTime.now().minusYears(1).minusMonths(2);

        AccreditationRequest req = requestRepository.save(AccreditationRequest.builder()
                .referenceNumber("D-2025-010")
                .oec(safe(oec5, oec1)).assignedToRa(safe(ra3, ra1))
                .type(RequestType.INITIAL)
                .domain("Laboratoire d'Essais - Environnement")
                .description("Accréditation ISO/IEC 17025 pour analyses environnementales: qualité de l'eau, air, sol.")
                .status(RequestStatus.SURVEILLANCE_SCHEDULED)
                .progress(100)
                .submissionDate(baseDate).assignmentDate(baseDate.plusDays(3))
                .receivabilityDecisionDate(baseDate.plusDays(12)).isReceivable(true)
                .evaluationStartDate(baseDate.plusMonths(3))
                .evaluationEndDate(baseDate.plusMonths(3).plusDays(4))
                .casDecisionDate(baseDate.plusMonths(5))
                .certificateIssueDate(baseDate.plusMonths(5).plusDays(10))
                .certificateExpirationDate(baseDate.plusMonths(5).plusDays(10).plusYears(4))
                .currentPhase("SURVEILLANCE")
                .currentStep("surveillance_scheduled")
                .nextAction("Première surveillance prévue dans 2 mois")
                .pendingWith("ALGERAC")
                .createdAt(baseDate)
                .build());

        EvaluationReport report = evaluationReportRepository.save(EvaluationReport.builder()
                .request(req).reportNumber("RAP-2025-010")
                .type(ReportType.FOR_09_LABORATORY)
                .conclusionAndRecommendation("FAVORABLE - Accréditation recommandée portée complète.")
                .status(EvaluationReportStatus.VALIDATED)
                .validatedByCD(true)
                .createdAt(baseDate.plusMonths(4))
                .build());

        CASDecision decision = casDecisionRepository.save(CASDecision.builder()
                .request(req).report(report).decisionNumber("DEC-CAS-2025-010")
                .decisionType(CASDecisionType.GRANT_FULL)
                .meetingDate(baseDate.plusMonths(5))
                .justification("Conformité démontrée.")
                .scope("Analyses environnementales: eau, air, sol")
                .appealRightNotified(true)
                .createdAt(baseDate.plusMonths(5))
                .build());

        AccreditationCertificate cert = certificateRepository.save(AccreditationCertificate.builder()
                .request(req).casDecision(decision)
                .certificateNumber("CERT-ALGERAC-2025-010")
                .issueDate(baseDate.plusMonths(5).plusDays(10))
                .expirationDate(baseDate.plusMonths(5).plusDays(10).plusYears(4))
                .oecIdentity("Laboratoire Environnement - " + safe(oec5, oec1).getFullName())
                .scope("Analyses de qualité de l'eau, de l'air et du sol")
                .technicalDomains("Analyses physico-chimiques et microbiologiques environnementales")
                .accreditationStandardReference("ISO/IEC 17025:2017")
                .signedByDG(true).signedByDT(true).published(true)
                .createdAt(baseDate.plusMonths(5).plusDays(10))
                .build());

        surveillancePlanRepository.save(SurveillancePlan.builder()
                .certificate(cert)
                .planCode("SURV-2025-010")
                .surveillanceCalendar("S1 à 12 mois, S2 à 24 mois, S3 à 36 mois")
                .frequency("Annuelle")
                .nextSurveillanceDate(LocalDateTime.now().plusMonths(2))
                .estimatedDurationPerEvaluation(3)
                .createdAt(baseDate.plusMonths(5).plusDays(15))
                .build());

        log.info("  ✓ D-2025-010: SURVEILLANCE_SCHEDULED");
    }

    // ============================================================
    // HELPER: Seed documents (FOR forms) for a request
    // ============================================================
    private void seedDocuments(AccreditationRequest req, User uploader, LocalDateTime baseDate) {
        String[][] docs = {
                {"FOR 01-1 - Engagement confidentialité et impartialité", "form", "approved"},
                {"FOR 02 - Fiche d'écart n°1", "form", "approved"},
                {"FOR 02 - Fiche d'écart n°2", "form", "approved"},
                {"FOR 04-07 - Rapport d'évaluation complet", "report", "approved"},
                {"FOR 08 - Rapport d'évaluation (Inspection)", "report", "approved"},
                {"FOR 09 - Rapport d'évaluation (Laboratoire)", "report", "approved"},
                {"FOR 12 - Rapport de visite préliminaire", "report", "approved"},
                {"FOR 14 - Avis membre CAS", "form", "approved"},
                {"FOR 15 - Décision CAS", "form", "approved"},
                {"FOR 18 - Dossier de demande d'accréditation", "dossier", "approved"},
                {"FOR 20 - Formulaire de candidature évaluateur", "form", "approved"},
                {"FOR 22 - Enquête de satisfaction OEC", "form", "approved"},
                {"FOR 23 - Fiche d'appréciation évaluation", "form", "approved"},
                {"FOR 26 - Fiche de composition d'équipe", "form", "approved"},
                {"FOR 32 - Plan d'évaluation", "form", "approved"},
                {"FOR 44 - Fiche de mandatement", "form", "approved"},
                {"FOR 47-48 - Ordre de mission", "form", "approved"},
                {"FOR 55 - Revue documentaire technique", "form", "approved"},
                {"FOR 56 - Revue documentaire qualité", "form", "approved"},
                {"FOR 63 - Convocation CAS", "form", "approved"},
                {"FOR 66 - Plan de surveillance", "form", "approved"},
                {"FOR 68 - Certificat d'accréditation", "certificate", "approved"},
                {"FOR 77-1 - Note d'évaluation", "form", "approved"},
                {"Manuel qualité v4.2", "manual", "approved"},
                {"Procédures d'essais - Béton", "procedure", "approved"},
                {"Procédures d'essais - Ciment", "procedure", "approved"},
                {"Certificats d'étalonnage - Équipements", "certificate", "approved"},
                {"Devis DEV-2025-001", "quotation", "approved"},
                {"Convention CONV-2025-001", "convention", "approved"},
        };

        for (int i = 0; i < docs.length; i++) {
            documentRepository.save(Document.builder()
                    .request(req)
                    .uploader(uploader)
                    .name(docs[i][0])
                    .type(docs[i][1])
                    .url("/documents/D-2025-001/" + docs[i][1] + "_" + (i + 1) + ".pdf")
                    .status(docs[i][2])
                    .uploadDate(baseDate.plusDays(i))
                    .build());
        }
    }

    // ============================================================
    // HELPERS
    // ============================================================

    private User safe(User preferred, User fallback) {
        return preferred != null ? preferred : fallback;
    }

    private TeamMember saveMember(EvaluationTeam team, User expert, TeamRole role,
                                  String specialization, boolean confSigned, boolean impSigned) {
        return teamMemberRepository.save(TeamMember.builder()
                .team(team).expert(expert).role(role)
                .specialization(specialization)
                .confidentialityAgreementSigned(confSigned)
                .impartialityAgreementSigned(impSigned)
                .conflictOfInterestDeclared(false)
                .available(true).recusedByOEC(false)
                .build());
    }

    private void saveMandate(AccreditationRequest req, TeamMember member,
                             MandateStatus status, LocalDateTime sentDate) {
        mandateRepository.save(Mandate.builder()
                .request(req).teamMember(member)
                .tasks("Évaluation selon plan FOR 32 - Domaine: " + member.getSpecialization())
                .missions("Évaluation sur site conformément au mandatement")
                .objectives("Vérifier conformité aux exigences de la norme applicable")
                .status(status)
                .sentToCdAt(sentDate.minusDays(5))
                .cdApprovedAt(sentDate.minusDays(3))
                .sentToMemberAt(sentDate)
                .createdAt(sentDate.minusDays(7))
                .build());
    }

    private void saveMissionOrder(AccreditationRequest req, User member, String orderNumber,
                                  MissionOrderStatus status, LocalDateTime created) {
        missionOrderRepository.save(MissionOrder.builder()
                .request(req).teamMember(member).orderNumber(orderNumber)
                .missionDetails("Mission d'évaluation sur site - Dossier " + req.getReferenceNumber())
                .status(status)
                .approvedByDT(true).dtApprovalDate(created.plusDays(2))
                .approvedByDG(true).dgApprovalDate(created.plusDays(3))
                .sentToMemberDate(created.plusDays(4))
                .missionStartDate(req.getEvaluationStartDate())
                .missionEndDate(req.getEvaluationEndDate())
                .createdAt(created)
                .build());
    }

    private void saveCASVote(CASMeeting meeting, User voter, String vote, String justification) {
        casVoteRepository.save(CASVote.builder()
                .meeting(meeting).voter(voter)
                .vote(vote).justification(justification)
                .attendanceConfirmed(true)
                .hasConflictOfInterest(false)
                .for14ConformityAssessment("CONFORME")
                .for14CompetenceAssessment("ADEQUATE")
                .for14ImpartialityAssessment("SATISFAISANTE")
                .createdAt(meeting.getMeetingDate())
                .build());
    }
}
