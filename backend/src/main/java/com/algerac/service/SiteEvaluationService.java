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
 * Service gérant la Phase II : Évaluation sur site
 * Couvre les étapes 6, 7 et 8 du processus d'accréditation PRO 12
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SiteEvaluationService {

    private final RequestRepository requestRepository;
    private final EvaluationTeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;
    private final EvaluationPlanRepository evalPlanRepository;
    private final MissionOrderRepository missionOrderRepository;
    private final EvaluationNoteRepository noteRepository;
    private final GapRepository gapRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final GapContestationRepository contestationRepository;
    private final ComplementaryEvaluationRepository compEvalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // ========== ÉTAPE 6 : PRÉPARATION DE L'ÉVALUATION ==========

    /**
     * RA envoie le mandatement à l'équipe (informe tâches et missions)
     */
    @Transactional
    public AccreditationRequest sendTeamMandate(Long requestId, String mandateDetails, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        validateRole(currentUser, UserRole.RA, "Seul le RA peut envoyer le mandatement");

        request.setCurrentStep("Mandatement envoyé à l'équipe");
        request.setNextAction("Équipe prend connaissance des tâches et missions");
        request.setPendingWith("Équipe d'évaluation");
        requestRepository.save(request);

        // Notifier tous les membres de l'équipe
        List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);
        if (!teams.isEmpty()) {
            List<TeamMember> members = memberRepository.findByTeam_Id(teams.get(0).getId());
            for (TeamMember member : members) {
                notificationService.createNotification(
                    member.getExpert().getId(),
                    "Mandatement d'évaluation",
                    String.format("Vous avez reçu le mandatement pour l'évaluation %s. %s",
                        request.getReferenceNumber(), mandateDetails),
                    "info"
                );
            }
        }

        log.info("Mandatement envoyé pour la demande {}", request.getReferenceNumber());
        return request;
    }

    /**
     * RA établit les demandes d'ordres de mission et les envoie au DT/DG
     */
    @Transactional
    public List<MissionOrder> createMissionOrderRequests(Long requestId, List<Map<String, Object>> orderDetails, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        validateRole(currentUser, UserRole.RA, "Seul le RA peut créer les ordres de mission");

        List<MissionOrder> orders = new ArrayList<>();

        for (Map<String, Object> detail : orderDetails) {
            Long memberId = ((Number) detail.get("teamMemberId")).longValue();
            User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Membre non trouvé: " + memberId));

            String orderNumber = "OM-" + Year.now().getValue() + "-" +
                String.format("%04d", new SecureRandom().nextInt(9999));

            MissionOrder order = MissionOrder.builder()
                .request(request)
                .teamMember(member)
                .orderNumber(orderNumber)
                .missionDetails((String) detail.get("missionDetails"))
                .checklistTasks((String) detail.get("checklistTasks"))
                .status(MissionOrderStatus.PENDING_DT_APPROVAL)
                .build();

            orders.add(missionOrderRepository.save(order));
        }

        request.setCurrentStep("Ordres de mission en attente d'approbation DT/DG");
        request.setNextAction("DT et DG doivent valider les ordres de mission");
        request.setPendingWith("DT/DG");
        requestRepository.save(request);

        // Notifier DT et DG
        notifyRoleUsers(UserRole.DT, "Ordres de mission à approuver",
            String.format("%d ordre(s) de mission pour %s nécessitent votre approbation.",
                orders.size(), request.getReferenceNumber()), "info");
        notifyRoleUsers(UserRole.DG, "Ordres de mission à approuver",
            String.format("%d ordre(s) de mission pour %s seront soumis après validation DT.",
                orders.size(), request.getReferenceNumber()), "info");

        log.info("{} ordres de mission créés pour {}", orders.size(), request.getReferenceNumber());
        return orders;
    }

    /**
     * DT/DG valident ou demandent ajustements sur un ordre de mission
     */
    @Transactional
    public MissionOrder validateMissionOrder(Long orderId, boolean approved, String adjustmentReason, User currentUser) {
        MissionOrder order = missionOrderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Ordre de mission non trouvé"));

        if (currentUser.getRole() == UserRole.DT) {
            if (approved) {
                order.setApprovedByDT(true);
                order.setDtApprovalDate(LocalDateTime.now());
                order.setStatus(MissionOrderStatus.PENDING_DG_APPROVAL);
                log.info("Ordre {} approuvé par DT", order.getOrderNumber());
            } else {
                order.setStatus(MissionOrderStatus.DRAFT);
                order.setMissionDetails(order.getMissionDetails() + "\n[AJUSTEMENT DT]: " + adjustmentReason);
                notifyRoleUsers(UserRole.RA, "Ajustement demandé sur ordre de mission",
                    String.format("L'ordre %s nécessite des ajustements: %s", order.getOrderNumber(), adjustmentReason), "warning");
            }
        } else if (currentUser.getRole() == UserRole.DG) {
            if (approved) {
                order.setApprovedByDG(true);
                order.setDgApprovalDate(LocalDateTime.now());
                order.setStatus(MissionOrderStatus.FULLY_APPROVED);
                log.info("Ordre {} approuvé par DG", order.getOrderNumber());
            } else {
                order.setStatus(MissionOrderStatus.PENDING_DT_APPROVAL);
                order.setMissionDetails(order.getMissionDetails() + "\n[AJUSTEMENT DG]: " + adjustmentReason);
                notifyRoleUsers(UserRole.RA, "Ajustement demandé par DG sur ordre de mission",
                    String.format("L'ordre %s nécessite des ajustements: %s", order.getOrderNumber(), adjustmentReason), "warning");
            }
        }

        return missionOrderRepository.save(order);
    }

    /**
     * RA transmet les ordres de mission (FOR 18) à l'équipe
     */
    @Transactional
    public void sendMissionOrdersToTeam(Long requestId, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        validateRole(currentUser, UserRole.RA, "Seul le RA peut transmettre les ordres de mission");

        List<MissionOrder> orders = missionOrderRepository.findByRequest_Id(requestId);
        for (MissionOrder order : orders) {
            if (order.getStatus() == MissionOrderStatus.FULLY_APPROVED) {
                order.setStatus(MissionOrderStatus.SENT_TO_MEMBER);
                order.setSentToMemberDate(LocalDateTime.now());
                missionOrderRepository.save(order);

                notificationService.createNotification(
                    order.getTeamMember().getId(),
                    "Ordre de mission reçu (FOR 18)",
                    String.format("Votre ordre de mission %s pour %s est disponible.",
                        order.getOrderNumber(), request.getReferenceNumber()),
                    "info"
                );
            }
        }

        request.setCurrentStep("Ordres de mission transmis à l'équipe");
        request.setNextAction("REE et équipe élaborent le plan d'évaluation (FOR 32)");
        request.setPendingWith("REE + Équipe");
        requestRepository.save(request);

        log.info("Ordres de mission envoyés à l'équipe pour {}", request.getReferenceNumber());
    }

    /**
     * REE + Équipe élaborent le plan d'évaluation (FOR 32) 
     */
    @Transactional
    public EvaluationPlan createEvaluationPlan(Long requestId, String dailyProgram,
            String activityDistribution, String schedules, String documentsToExamine,
            LocalDateTime evaluationDate, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        List<EvaluationTeam> teams = teamRepository.findByRequest_Id(requestId);

        String planCode = "PLAN-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        EvaluationPlan plan = EvaluationPlan.builder()
            .request(request)
            .team(teams.isEmpty() ? null : teams.get(0))
            .planCode(planCode)
            .planFOR32(dailyProgram + "\n" + activityDistribution + "\n" + schedules)
            .dailyProgram(dailyProgram)
            .activityDistribution(activityDistribution)
            .schedules(schedules)
            .documentsToExamine(documentsToExamine)
            .evaluationDate(evaluationDate)
            .createdByREE(LocalDateTime.now())
            .status(EvaluationPlanStatus.SUBMITTED_TO_CD)
            .build();

        plan = evalPlanRepository.save(plan);

        request.setStatus(RequestStatus.EVALUATION_PLAN_PREPARATION);
        request.setCurrentStep("Plan d'évaluation soumis au RA pour vérification");
        request.setNextAction("RA vérifie l'alignement avec la norme, la cohérence et les exigences");
        request.setPendingWith("RA");
        requestRepository.save(request);

        // Notifier RA
        notifyRoleUsers(UserRole.RA, "Plan d'évaluation à vérifier",
            String.format("Le plan %s pour %s est soumis pour vérification.",
                planCode, request.getReferenceNumber()), "info");

        log.info("Plan d'évaluation {} créé pour {}", planCode, request.getReferenceNumber());
        return plan;
    }

    /**
     * RA vérifie et valide/rejette le plan d'évaluation
     */
    @Transactional
    public EvaluationPlan validateEvaluationPlan(Long planId, boolean approved,
            String adjustments, User currentUser) {
        EvaluationPlan plan = evalPlanRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));
        validateRole(currentUser, UserRole.RA, "Seul le RA peut valider le plan d'évaluation");

        AccreditationRequest request = plan.getRequest();

        if (approved) {
            plan.setValidatedByCD(true);
            plan.setCdValidationDate(LocalDateTime.now());
            plan.setStatus(EvaluationPlanStatus.VALIDATED);

            request.setStatus(RequestStatus.EVALUATION_PLAN_VALIDATION);
            request.setCurrentStep("Plan d'évaluation validé");
            request.setNextAction("REE transmet le plan à l'OEC (min 5 jours avant évaluation)");
            request.setPendingWith("REE");

            log.info("Plan {} validé pour {}", plan.getPlanCode(), request.getReferenceNumber());
        } else {
            plan.setCdAdjustmentRequests(adjustments);
            plan.setStatus(EvaluationPlanStatus.ADJUSTMENTS_NEEDED);

            request.setCurrentStep("Plan d'évaluation - ajustements demandés");
            request.setNextAction("REE ajuste le plan selon les remarques du RA");
            request.setPendingWith("REE");

            log.info("Ajustements demandés sur le plan {} pour {}", plan.getPlanCode(), request.getReferenceNumber());
        }

        evalPlanRepository.save(plan);
        requestRepository.save(request);
        return plan;
    }

    /**
     * REE transmet le plan à l'OEC (min 5 jours avant)
     */
    @Transactional
    public EvaluationPlan sendPlanToOEC(Long planId, User currentUser) {
        EvaluationPlan plan = evalPlanRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Plan d'évaluation non trouvé"));

        if (plan.getStatus() != EvaluationPlanStatus.VALIDATED) {
            throw new RuntimeException("Le plan doit être validé avant transmission à l'OEC");
        }

        // Vérifier le délai de 5 jours
        if (plan.getEvaluationDate() != null) {
            long daysUntilEval = java.time.temporal.ChronoUnit.DAYS.between(
                LocalDateTime.now(), plan.getEvaluationDate());
            if (daysUntilEval < 5) {
                log.warn("CRITIQUE: Plan envoyé à moins de 5 jours de l'évaluation ({} jours)", daysUntilEval);
            }
        }

        plan.setSentToOEC(LocalDateTime.now());
        plan.setStatus(EvaluationPlanStatus.SENT_TO_OEC);
        evalPlanRepository.save(plan);

        AccreditationRequest request = plan.getRequest();
        request.setStatus(RequestStatus.EVALUATION_PLANNED);
        request.setCurrentStep("Plan d'évaluation envoyé à l'OEC");
        request.setNextAction("Évaluation terrain prévue");
        request.setPendingWith("Équipe d'évaluation");
        requestRepository.save(request);

        // Notifier l'OEC
        notificationService.createNotification(
            request.getOec().getId(),
            "Plan d'évaluation reçu",
            String.format("Le plan d'évaluation pour %s est disponible. Date prévue: %s",
                request.getReferenceNumber(),
                plan.getEvaluationDate() != null ? plan.getEvaluationDate().toLocalDate().toString() : "à confirmer"),
            "info"
        );

        log.info("Plan {} envoyé à l'OEC pour {}", plan.getPlanCode(), request.getReferenceNumber());
        return plan;
    }

    // ========== ÉTAPE 7 : ÉVALUATION TERRAIN ==========

    /**
     * 7.1 REE démarrage de la réunion d'ouverture
     */
    @Transactional
    public EvaluationNote createOpeningMeetingNote(Long requestId, String attendees,
            String openingDetails, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        request.setStatus(RequestStatus.EVALUATION_IN_PROGRESS);
        request.setEvaluationStartDate(LocalDateTime.now());
        request.setCurrentStep("Réunion d'ouverture en cours");
        request.setNextAction("Conduite de l'évaluation");
        request.setPendingWith("Équipe d'évaluation");
        requestRepository.save(request);

        EvaluationNote note = EvaluationNote.builder()
            .request(request)
            .author(currentUser)
            .noteType("OPENING_MEETING")
            .observations(openingDetails)
            .synthesis(attendees)
            .authorTeamRole(TeamRole.REE)
            .build();

        note = noteRepository.save(note);

        // Notifier OEC
        notificationService.createNotification(
            request.getOec().getId(),
            "Réunion d'ouverture",
            String.format("La réunion d'ouverture pour l'évaluation %s a débuté.", request.getReferenceNumber()),
            "info"
        );

        log.info("Réunion d'ouverture démarrée pour {}", request.getReferenceNumber());
        return note;
    }

    /**
     * 7.2 Évaluateur enregistre ses observations (conduite parallèle)
     */
    @Transactional
    public EvaluationNote createEvaluatorNote(Long requestId, String noteType,
            String observations, String synthesis, String checklistStatus,
            TeamRole role, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        EvaluationNote note = EvaluationNote.builder()
            .request(request)
            .author(currentUser)
            .noteType(noteType)
            .observations(observations)
            .synthesis(synthesis)
            .checklistStatus(checklistStatus)
            .authorTeamRole(role)
            .build();

        return noteRepository.save(note);
    }

    /**
     * 7.2 Évaluateur identifie un écart → crée une fiche FOR 02
     */
    @Transactional
    public Gap createGapFOR02(Long requestId, GapType type, String description,
            String requirement, String evidence, String for02Content, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String gapCode = "FOR02-" + Year.now().getValue() + "-" +
            String.format("%04d", new SecureRandom().nextInt(9999));

        Gap gap = Gap.builder()
            .request(request)
            .gapCode(gapCode)
            .type(type)
            .description(description)
            .requirement(requirement)
            .evidence(evidence)
            .FOR02Content(for02Content)
            .identifiedDate(LocalDateTime.now())
            .status(GapStatus.IDENTIFIED)
            .build();

        gap = gapRepository.save(gap);

        // Vérifier règles de requalification automatiquement
        checkAndApplyReclassification(gap);

        log.info("Écart {} ({}) identifié pour {}", gapCode, type, request.getReferenceNumber());
        return gap;
    }

    /**
     * 7.3 Consensus équipe (avant clôture)
     */
    @Transactional
    public EvaluationNote createConsensusNote(Long requestId, String consensusDetails,
            boolean consensusReached, String cdArbitration, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String observations = consensusDetails;
        if (!consensusReached && cdArbitration != null) {
            observations += "\n\n[ARBITRAGE CD]: " + cdArbitration;
        }

        EvaluationNote note = EvaluationNote.builder()
            .request(request)
            .author(currentUser)
            .noteType("TEAM_CONSENSUS")
            .observations(observations)
            .synthesis(consensusReached ? "Consensus atteint" : "Arbitrage CD requis")
            .authorTeamRole(TeamRole.REE)
            .sentToREE(true)
            .sentDate(LocalDateTime.now())
            .build();

        return noteRepository.save(note);
    }

    /**
     * 7.4 Réunion de clôture
     */
    @Transactional
    public EvaluationNote createClosingMeetingNote(Long requestId, String closingDetails,
            String generalResults, String strengths, String improvements,
            String gapConsequences, String appealRights, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        String fullDetails = String.format(
            "=== RÉSULTATS GÉNÉRAUX ===\n%s\n\n" +
            "=== POINTS FORTS ===\n%s\n\n" +
            "=== POINTS D'AMÉLIORATION ===\n%s\n\n" +
            "=== CONSÉQUENCES DES ÉCARTS SUR L'ACCRÉDITATION ===\n%s\n\n" +
            "=== DROIT DE RECOURS ===\n%s\n\n" +
            "=== DÉTAILS CLÔTURE ===\n%s",
            generalResults, strengths, improvements,
            gapConsequences, appealRights, closingDetails
        );

        EvaluationNote note = EvaluationNote.builder()
            .request(request)
            .author(currentUser)
            .noteType("CLOSING_MEETING")
            .observations(fullDetails)
            .synthesis("Réunion de clôture terminée")
            .authorTeamRole(TeamRole.REE)
            .sentToREE(true)
            .sentDate(LocalDateTime.now())
            .build();

        note = noteRepository.save(note);

        // Mettre à jour la demande
        request.setEvaluationEndDate(LocalDateTime.now());
        request.setStatus(RequestStatus.EVALUATION_COMPLETED);
        request.setCurrentStep("Évaluation terminée - Réunion de clôture effectuée");
        request.setNextAction("Remise des fiches d'écart FOR 02 à l'OEC");
        request.setPendingWith("REE");
        requestRepository.save(request);

        log.info("Réunion de clôture terminée pour {}", request.getReferenceNumber());
        return note;
    }

    /**
     * 7.4 OEC conteste un écart lors de la réunion de clôture
     */
    @Transactional
    public GapContestation contestGap(Long gapId, String reason, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
            .orElseThrow(() -> new RuntimeException("Écart non trouvé"));

        GapContestation contestation = GapContestation.builder()
            .gap(gap)
            .request(gap.getRequest())
            .contestationReason(reason)
            .contestedBy(currentUser)
            .contestationDate(LocalDateTime.now())
            .status(ContestationStatus.FILED)
            .build();

        contestation = contestationRepository.save(contestation);

        // Notifier le CD immédiatement
        notifyRoleUsers(UserRole.CD, "Contestation d'écart déposée",
            String.format("L'OEC conteste l'écart %s pour %s. Motif: %s. Désignez une personne non impliquée pour examiner.",
                gap.getGapCode(), gap.getRequest().getReferenceNumber(), reason), "warning");

        log.info("Écart {} contesté par l'OEC pour {}", gap.getGapCode(), gap.getRequest().getReferenceNumber());
        return contestation;
    }

    /**
     * CD désigne un examinateur pour la contestation
     */
    @Transactional
    public GapContestation designateContestationExaminer(Long contestationId, Long examinerId, User currentUser) {
        GapContestation contestation = contestationRepository.findById(contestationId)
            .orElseThrow(() -> new RuntimeException("Contestation non trouvée"));
        validateRole(currentUser, UserRole.CD, "Seul le CD peut désigner un examinateur");

        User examiner = userRepository.findById(examinerId)
            .orElseThrow(() -> new RuntimeException("Examinateur non trouvé"));

        contestation.setDesignatedExaminer(examiner);
        contestation.setExaminerDesignatedDate(LocalDateTime.now());
        contestation.setStatus(ContestationStatus.EXAMINER_DESIGNATED);
        contestationRepository.save(contestation);

        notificationService.createNotification(examinerId,
            "Examen de contestation d'écart",
            String.format("Vous êtes désigné pour examiner la contestation de l'écart %s.",
                contestation.getGap().getGapCode()),
            "info"
        );

        return contestation;
    }

    /**
     * Examinateur rend sa décision sur la contestation
     */
    @Transactional
    public GapContestation resolveContestation(Long contestationId, boolean founded,
            String findings, String decision, User currentUser) {
        GapContestation contestation = contestationRepository.findById(contestationId)
            .orElseThrow(() -> new RuntimeException("Contestation non trouvée"));

        contestation.setExaminerFindings(findings);
        contestation.setContestationFounded(founded);
        contestation.setExaminerDecision(decision);

        Gap gap = contestation.getGap();

        if (founded) {
            contestation.setStatus(ContestationStatus.FOUNDED);
            contestation.setResolutionDate(LocalDateTime.now());
            // Modifier ou supprimer l'écart selon la décision
            if ("SUPPRIMER".equals(decision)) {
                gap.setStatus(GapStatus.RESOLVED);
                gap.setReclassificationReason("Écart supprimé suite à contestation fondée");
            }
            gapRepository.save(gap);
        } else {
            contestation.setStatus(ContestationStatus.NOT_FOUNDED);
        }

        contestationRepository.save(contestation);

        // Notifier l'OEC
        notificationService.createNotification(
            contestation.getRequest().getOec().getId(),
            founded ? "Contestation acceptée" : "Contestation non fondée",
            String.format("Votre contestation sur l'écart %s est %s. %s",
                gap.getGapCode(), founded ? "fondée" : "non fondée", findings),
            founded ? "success" : "warning"
        );

        return contestation;
    }

    /**
     * OEC maintient sa position après contestation non fondée → escalade au CAS
     */
    @Transactional
    public GapContestation escalateContestationToCAS(Long contestationId, User currentUser) {
        GapContestation contestation = contestationRepository.findById(contestationId)
            .orElseThrow(() -> new RuntimeException("Contestation non trouvée"));

        contestation.setOecMaintainsPosition(true);
        contestation.setEscalatedToCAS(true);
        contestation.setStatus(ContestationStatus.ESCALATED_TO_CAS);
        contestationRepository.save(contestation);

        // Notifier les membres CAS
        notifyRoleUsers(UserRole.CAS_MEMBER, "Contestation escaladée au CAS",
            String.format("Une contestation d'écart pour %s a été escaladée au CAS pour arbitrage.",
                contestation.getRequest().getReferenceNumber()), "warning");

        return contestation;
    }

    /**
     * REE transmet les documents de clôture à CD/RA
     */
    @Transactional
    public void transmitClosingDocuments(Long requestId, String attendanceSheets,
            String missionOrderRefs, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        request.setCurrentStep("Documents de clôture transmis à CD/RA");
        request.setNextAction("OEC doit soumettre plans d'actions sous 10 jours");
        request.setPendingWith("OEC");
        requestRepository.save(request);

        notifyRoleUsers(UserRole.CD, "Documents de clôture reçus",
            String.format("Les documents de clôture de l'évaluation %s sont disponibles.", request.getReferenceNumber()), "info");
        notifyRoleUsers(UserRole.RA, "Documents de clôture reçus",
            String.format("Les documents de clôture de l'évaluation %s sont disponibles.", request.getReferenceNumber()), "info");

        log.info("Documents de clôture transmis pour {}", request.getReferenceNumber());
    }

    // ========== ÉTAPE 8 : TRAITEMENT DES ÉCARTS ==========

    /**
     * Demander les plans d'action à l'OEC (délai 10 jours)
     */
    @Transactional
    public void requestActionPlans(Long requestId, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);

        List<Gap> gaps = gapRepository.findByRequest_Id(requestId);
        if (gaps.isEmpty()) {
            throw new RuntimeException("Aucun écart identifié pour cette demande");
        }

        // Mettre les écarts en attente de plan
        for (Gap gap : gaps) {
            if (gap.getStatus() == GapStatus.IDENTIFIED) {
                gap.setStatus(GapStatus.AWAITING_ACTION_PLAN);
                gapRepository.save(gap);
            }
        }

        request.setStatus(RequestStatus.AWAITING_ACTION_PLANS);
        request.setCurrentStep("En attente des plans d'action de l'OEC");
        request.setNextAction("L'OEC dispose de 10 jours pour soumettre ses plans d'action");
        request.setPendingWith("OEC");
        // Calculer la deadline
        request.setNextActionDate(LocalDateTime.now().plusDays(10));
        requestRepository.save(request);

        notificationService.notifyOECActionPlansRequired(request, gaps.size());
        log.info("Plans d'action demandés pour {} ({} écarts)", request.getReferenceNumber(), gaps.size());
    }

    /**
     * OEC soumet un plan d'action pour un écart
     */
    @Transactional
    public ActionPlan submitActionPlan(Long gapId, String correctiveActions,
            String preventiveActions, String responsiblePerson,
            LocalDateTime implementationDeadline, String supportingDocuments, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
            .orElseThrow(() -> new RuntimeException("Écart non trouvé"));

        AccreditationRequest request = gap.getRequest();

        // Vérifier que c'est bien l'OEC qui soumet
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut soumettre un plan d'action");
        }

        // Vérifier délai 10 jours
        boolean submittedInTime = true;
        if (request.getEvaluationEndDate() != null) {
            submittedInTime = LocalDateTime.now().isBefore(request.getEvaluationEndDate().plusDays(10));
        }

        // Vérifier si un plan existait déjà (resoumission après rejet)
        Optional<ActionPlan> existingPlan = actionPlanRepository.findByGap_Id(gapId);
        ActionPlan plan;
        
        if (existingPlan.isPresent()) {
            plan = existingPlan.get();
            plan.setCorrectiveActions(correctiveActions);
            plan.setPreventiveActions(preventiveActions);
            plan.setResponsiblePerson(responsiblePerson);
            plan.setImplementationDeadline(implementationDeadline);
            plan.setSupportingDocuments(supportingDocuments);
            plan.setSubmittedByOEC(LocalDateTime.now());
            plan.setSubmittedInTime(submittedInTime);
            plan.setStatus(ActionPlanStatus.SUBMITTED);
            plan.setAcceptedByTeam(null);
            plan.setEvaluatedByTeam(null);
            plan.setTeamFeedback(null);
            plan.setRejectionReason(null);
        } else {
            plan = ActionPlan.builder()
                .gap(gap)
                .correctiveActions(correctiveActions)
                .preventiveActions(preventiveActions)
                .responsiblePerson(responsiblePerson)
                .implementationDeadline(implementationDeadline)
                .supportingDocuments(supportingDocuments)
                .submittedByOEC(LocalDateTime.now())
                .submittedInTime(submittedInTime)
                .status(ActionPlanStatus.SUBMITTED)
                .build();
        }

        plan = actionPlanRepository.save(plan);
        gap.setStatus(GapStatus.PLAN_SUBMITTED);
        gapRepository.save(gap);

        // Notifier l'équipe
        notificationService.notifyTeamActionPlanSubmitted(request, gap.getGapCode());

        if (!submittedInTime) {
            log.warn("Plan d'action pour {} soumis hors délai", gap.getGapCode());
        }

        return plan;
    }

    /**
     * Équipe évalue un plan d'action (délai 5 jours)
     */
    @Transactional
    public ActionPlan evaluateActionPlan(Long gapId, boolean accepted, String feedback,
            String rejectionReason, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
            .orElseThrow(() -> new RuntimeException("Écart non trouvé"));

        ActionPlan plan = actionPlanRepository.findByGap_Id(gapId)
            .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé pour cet écart"));

        plan.setEvaluatedByTeam(LocalDateTime.now());
        plan.setAcceptedByTeam(accepted);
        plan.setTeamFeedback(feedback);

        if (accepted) {
            plan.setStatus(ActionPlanStatus.ACCEPTED);
            gap.setStatus(GapStatus.PLAN_ACCEPTED);
            notificationService.notifyOECActionPlanAccepted(gap.getRequest(), gap.getGapCode());
        } else {
            plan.setStatus(ActionPlanStatus.REJECTED);
            plan.setRejectionReason(rejectionReason);
            gap.setStatus(GapStatus.PLAN_REJECTED);
            notificationService.notifyOECActionPlanRejected(gap.getRequest(), gap.getGapCode(), rejectionReason);
        }

        actionPlanRepository.save(plan);
        gapRepository.save(gap);

        // Vérifier si tous les plans sont traités
        checkAllPlansProcessed(gap.getRequest().getId());

        return plan;
    }

    /**
     * OEC fournit les preuves de mise en œuvre
     */
    @Transactional
    public ActionPlan submitImplementationEvidence(Long gapId, String evidence,
            LocalDateTime completedDate, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
            .orElseThrow(() -> new RuntimeException("Écart non trouvé"));

        ActionPlan plan = actionPlanRepository.findByGap_Id(gapId)
            .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));

        plan.setImplementationEvidence(evidence);
        plan.setImplementationCompletedDate(completedDate != null ? completedDate : LocalDateTime.now());
        plan.setStatus(ActionPlanStatus.EVIDENCE_SUBMITTED);
        gap.setStatus(GapStatus.EVIDENCE_PROVIDED);

        actionPlanRepository.save(plan);
        gapRepository.save(gap);

        notificationService.notifyTeamEvidenceSubmitted(gap.getRequest(), gap.getGapCode());
        return plan;
    }

    /**
     * Équipe vérifie les preuves
     */
    @Transactional
    public ActionPlan verifyEvidence(Long gapId, boolean satisfactory, String feedback, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
            .orElseThrow(() -> new RuntimeException("Écart non trouvé"));

        ActionPlan plan = actionPlanRepository.findByGap_Id(gapId)
            .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));

        plan.setEvidenceSatisfactory(satisfactory);
        plan.setTeamFeedback(feedback);

        if (satisfactory) {
            if (gap.getType() == GapType.CRITIQUE) {
                // Écart critique → recommander évaluation complémentaire
                gap.setStatus(GapStatus.NEEDS_COMPLEMENTARY_EVAL);
                plan.setStatus(ActionPlanStatus.VERIFIED);
                notificationService.notifyCDComplementaryEvalDecision(gap.getRequest(), gap.getGapCode());
            } else {
                // Non critique → soldé (vérification lors évaluation suivante)
                gap.setStatus(GapStatus.RESOLVED);
                plan.setStatus(ActionPlanStatus.COMPLETED);
            }
        } else {
            // Preuves insuffisantes → retour OEC
            gap.setStatus(GapStatus.IMPLEMENTATION);
            plan.setStatus(ActionPlanStatus.IMPLEMENTATION_IN_PROGRESS);
            notificationService.notifyOECEvidenceInsufficient(gap.getRequest(), gap.getGapCode());
        }

        actionPlanRepository.save(plan);
        gapRepository.save(gap);

        // Vérifier si tous les écarts sont traités
        checkAllGapsResolved(gap.getRequest().getId());

        return plan;
    }

    /**
     * CD décide d'une évaluation complémentaire pour un écart critique
     */
    @Transactional
    public ComplementaryEvaluation decideComplementaryEvaluation(Long requestId,
            boolean needed, User currentUser) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        validateRole(currentUser, UserRole.CD, "Seul le CD peut décider d'une évaluation complémentaire");

        if (!needed) {
            // Pas d'évaluation complémentaire → solder directement les écarts critiques vérifiés
            List<Gap> criticalGaps = gapRepository.findByRequest_IdAndStatus(requestId, GapStatus.NEEDS_COMPLEMENTARY_EVAL);
            for (Gap gap : criticalGaps) {
                gap.setStatus(GapStatus.RESOLVED);
                gapRepository.save(gap);
                ActionPlan plan = actionPlanRepository.findByGap_Id(gap.getId()).orElse(null);
                if (plan != null) {
                    plan.setStatus(ActionPlanStatus.COMPLETED);
                    actionPlanRepository.save(plan);
                }
            }
            checkAllGapsResolved(requestId);
            return null;
        }

        String evalCode = "COMP-" + Year.now().getValue() + "-" +
            String.format("%04d", new Random().nextInt(9999));

        ComplementaryEvaluation compEval = ComplementaryEvaluation.builder()
            .request(request)
            .evaluationCode(evalCode)
            .decidedByCD(currentUser)
            .status(ComplementaryEvaluationStatus.DECIDED)
            .build();

        compEval = compEvalRepository.save(compEval);

        request.setStatus(RequestStatus.COMPLEMENTARY_EVALUATION_NEEDED);
        request.setCurrentStep("Évaluation complémentaire décidée par le CD");
        request.setNextAction("RA établit le devis d'évaluation complémentaire");
        request.setPendingWith("RA");
        requestRepository.save(request);

        log.info("Évaluation complémentaire {} décidée pour {}", evalCode, request.getReferenceNumber());
        return compEval;
    }

    /**
     * Vérification du délai global de 6 mois
     */
    public Map<String, Object> checkGlobalDeadline(Long requestId) {
        AccreditationRequest request = getRequestOrThrow(requestId);
        Map<String, Object> result = new HashMap<>();

        LocalDateTime evaluationEndDate = request.getEvaluationEndDate();
        if (evaluationEndDate == null) {
            result.put("deadlinePassed", false);
            result.put("message", "Date de clôture non définie");
            return result;
        }

        LocalDateTime deadline = evaluationEndDate.plusMonths(6);
        boolean deadlinePassed = LocalDateTime.now().isAfter(deadline);
        long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), deadline);

        // Vérifier les écarts critiques
        boolean allCriticalResolved = gapRepository.countByRequest_IdAndTypeAndStatusNot(
            requestId, GapType.CRITIQUE, GapStatus.RESOLVED) == 0;

        // Vérifier les plans NC acceptés
        List<Gap> ncGaps = gapRepository.findByRequest_IdAndType(requestId, GapType.NON_CRITIQUE);
        long ncPlansAccepted = ncGaps.stream()
            .filter(g -> g.getStatus() == GapStatus.PLAN_ACCEPTED || g.getStatus() == GapStatus.RESOLVED)
            .count();

        result.put("evaluationEndDate", evaluationEndDate);
        result.put("deadline", deadline);
        result.put("daysRemaining", daysRemaining);
        result.put("deadlinePassed", deadlinePassed);
        result.put("allCriticalResolved", allCriticalResolved);
        result.put("totalNCGaps", ncGaps.size());
        result.put("ncPlansAccepted", ncPlansAccepted);
        result.put("canProceedToReport", allCriticalResolved && ncPlansAccepted == ncGaps.size());

        if (deadlinePassed && !allCriticalResolved) {
            result.put("escalationNeeded", true);
            result.put("message", "DÉLAI DÉPASSÉ - Escalade au CAS requise");
        }

        return result;
    }

    // ========== PRIVATE HELPERS ==========

    private void checkAndApplyReclassification(Gap gap) {
        if (gap.getType() != GapType.NON_CRITIQUE) return;

        boolean shouldReclassify = false;
        String reason = null;

        // Règle 1: ≥3 NC sur même exigence
        long countOnSame = gapRepository.countByRequest_IdAndRequirement(
            gap.getRequest().getId(), gap.getRequirement());
        gap.setCountOnSameRequirement((int) countOnSame);

        if (countOnSame >= 3) {
            shouldReclassify = true;
            reason = "Accumulation ≥3 écarts NC sur l'exigence: " + gap.getRequirement();
        }

        // Règle 2: Systématique multi-départements
        if (gap.getSystematicMultiDepartment() != null && gap.getSystematicMultiDepartment()) {
            shouldReclassify = true;
            reason = "Écart systématique constaté dans plusieurs départements";
        }

        // Règle 3: Récurrent d'évaluation précédente
        if (gap.getRecurrentFromPrevious() != null && gap.getRecurrentFromPrevious()) {
            shouldReclassify = true;
            reason = "Écart récurrent observé lors de l'évaluation précédente";
        }

        if (shouldReclassify) {
            gap.setType(GapType.CRITIQUE);
            gap.setReclassifiedToCritical(true);
            gap.setReclassificationReason(reason);
            gap.setReclassificationDate(LocalDateTime.now());
            gapRepository.save(gap);
            log.warn("Écart {} requalifié en CRITIQUE. Raison: {}", gap.getGapCode(), reason);
        } else {
            gapRepository.save(gap);
        }
    }

    private void checkAllPlansProcessed(Long requestId) {
        List<Gap> gaps = gapRepository.findByRequest_Id(requestId);
        boolean allProcessed = gaps.stream().allMatch(g ->
            g.getStatus() == GapStatus.PLAN_ACCEPTED ||
            g.getStatus() == GapStatus.PLAN_REJECTED ||
            g.getStatus() == GapStatus.RESOLVED ||
            g.getStatus() == GapStatus.NEEDS_COMPLEMENTARY_EVAL
        );

        if (allProcessed) {
            AccreditationRequest request = requestRepository.findById(requestId).orElse(null);
            if (request != null) {
                request.setStatus(RequestStatus.ACTION_PLANS_EVALUATION);
                request.setCurrentStep("Tous les plans d'action ont été évalués");
                requestRepository.save(request);
            }
        }
    }

    private void checkAllGapsResolved(Long requestId) {
        List<Gap> gaps = gapRepository.findByRequest_Id(requestId);
        boolean allResolved = gaps.stream().allMatch(g -> g.getStatus() == GapStatus.RESOLVED);

        if (allResolved) {
            AccreditationRequest request = requestRepository.findById(requestId).orElse(null);
            if (request != null) {
                request.setStatus(RequestStatus.GAPS_RESOLVED);
                request.setCurrentStep("Tous les écarts sont soldés");
                request.setNextAction("REE rédige le rapport d'évaluation");
                request.setPendingWith("REE");
                requestRepository.save(request);
            }
        }
    }

    private AccreditationRequest getRequestOrThrow(Long requestId) {
        return requestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Demande non trouvée: " + requestId));
    }

    private void validateRole(User user, UserRole expectedRole, String errorMessage) {
        if (user.getRole() != expectedRole) {
            throw new RuntimeException(errorMessage);
        }
    }

    private void notifyRoleUsers(UserRole role, String title, String message, String type) {
        List<User> users = userRepository.findByRole(role);
        for (User user : users) {
            notificationService.createNotification(user.getId(), title, message, type);
        }
    }
}
