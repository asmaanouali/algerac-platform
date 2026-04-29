package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service unifié pour la gestion des compétences PRO 06 §5.4–5.6.
 * - Plan triennal de supervision (FOR 65-7)
 * - Fiches FOR 21-3 (expert) et FOR 65-1/65-6 (évaluateurs)
 * - Extensions de compétences
 * - Bulletins d'information régulière
 * - Détection inactivité ≥ 1 an et requalification
 * - Qualification SUP (PRO 06 §5.2)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unused")
public class CompetencyManagementService {

    private final SupervisionPlanRepository supervisionPlanRepository;
    private final ExpertSupervisionSheetRepository expertSupervisionSheetRepository;
    private final EvaluatorMonitoringSheetRepository evaluatorMonitoringSheetRepository;
    private final CompetenceExtensionRepository competenceExtensionRepository;
    private final RegularInfoBulletinRepository regularInfoBulletinRepository;
    private final QualificationRepository qualificationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ObservationReportRepository observationReportRepository;

    // ==================== SUPERVISION PLAN (FOR 65-7) ====================

    public List<SupervisionPlan> getAllSupervisionPlans() {
        return supervisionPlanRepository.findAll();
    }

    public List<SupervisionPlan> getPlansByEvaluator(Long evaluatorId) {
        return supervisionPlanRepository.findByEvaluator_Id(evaluatorId);
    }

    public List<SupervisionPlan> getPlansBySupervisor(Long supervisorId) {
        return supervisionPlanRepository.findBySupervisor_Id(supervisorId);
    }

    public List<SupervisionPlan> getPlansByYear(int year) {
        return supervisionPlanRepository.findByPlanYear(year);
    }

    public SupervisionPlan getSupervisionPlanById(Long id) {
        return supervisionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan introuvable"));
    }

    @Transactional
    public SupervisionPlan createSupervisionPlan(Map<String, Object> data) {
        Long evaluatorId = Long.valueOf(data.get("evaluatorId").toString());
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé"));

        SupervisionPlan.SupervisionPlanBuilder builder = SupervisionPlan.builder()
                .evaluator(evaluator)
                .planYear(getInt(data, "planYear", LocalDate.now().getYear()))
                .plannedDate(parseDate(data.get("plannedDate")))
                .notes((String) data.get("notes"));

        if (data.get("supervisorId") != null) {
            Long supId = Long.valueOf(data.get("supervisorId").toString());
            User supervisor = userRepository.findById(supId).orElse(null);
            if (supervisor != null && !supervisor.hasRole(UserRole.SUP)) {
                throw new RuntimeException("L'utilisateur sélectionné n'est pas un superviseur qualifié");
            }
            builder.supervisor(supervisor);
        }

        if (data.get("qualificationId") != null) {
            Long qId = Long.valueOf(data.get("qualificationId").toString());
            Qualification q = qualificationRepository.findById(qId).orElse(null);
            builder.qualification(q);
            if (q != null) builder.supervisedRole(q.getQualifiedRole());
        }

        if (data.get("supervisedRole") != null) {
            builder.supervisedRole(TeamRole.valueOf((String) data.get("supervisedRole")));
        }

        SupervisionPlan plan = supervisionPlanRepository.save(builder.build());

        if (plan.getSupervisor() != null) {
            notificationService.createNotification(
                    plan.getSupervisor().getId(),
                    "Nouvelle supervision planifiée (FOR 65-7)",
                    "Vous êtes désigné superviseur pour " + evaluator.getFullName() +
                            (plan.getPlannedDate() != null ? " — prévu le " + plan.getPlannedDate() : ""),
                    "info"
            );
        }
        return plan;
    }

    @Transactional
    public SupervisionPlan updateSupervisionPlan(Long id, Map<String, Object> data) {
        SupervisionPlan plan = supervisionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé"));

        if (data.get("supervisorId") != null) {
            Long supId = Long.valueOf(data.get("supervisorId").toString());
            User sup = userRepository.findById(supId).orElseThrow();
            if (!sup.hasRole(UserRole.SUP)) {
                throw new RuntimeException("L'utilisateur n'a pas le rôle SUP");
            }
            plan.setSupervisor(sup);
        }
        if (data.get("plannedDate") != null) plan.setPlannedDate(parseDate(data.get("plannedDate")));
        if (data.get("status") != null) plan.setStatus(SupervisionPlanStatus.valueOf((String) data.get("status")));
        if (data.get("notes") != null) plan.setNotes((String) data.get("notes"));
        if (data.get("requestId") != null) plan.setRequestId(Long.valueOf(data.get("requestId").toString()));

        return supervisionPlanRepository.save(plan);
    }

    @Transactional
    public SupervisionPlan completeSupervisionPlan(Long id, Long sheetId) {
        SupervisionPlan plan = supervisionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan non trouvé"));
        plan.setStatus(SupervisionPlanStatus.COMPLETED);
        plan.setCompletedDate(LocalDate.now());
        plan.setSupervisionSheetId(sheetId);
        return supervisionPlanRepository.save(plan);
    }

    /** Suggestions : qualifications actives non supervisées dans l'année courante. */
    public List<Qualification> suggestEvaluatorsToSupervise() {
        int currentYear = LocalDate.now().getYear();
        List<Qualification> active = qualificationRepository.findByStatusIn(
                List.of(QualificationStatus.QUALIFIED, QualificationStatus.RENEWED));
        List<Qualification> suggestions = new ArrayList<>();
        for (Qualification q : active) {
            long count = supervisionPlanRepository.countByEvaluator_IdAndPlanYearGreaterThanEqual(
                    q.getEvaluator().getId(), currentYear - 2);
            if (count == 0) suggestions.add(q);
        }
        return suggestions;
    }

    // ==================== FOR 21-3 (Expert) ====================

    public List<ExpertSupervisionSheet> getExpertSheetsByExpert(Long expertId) {
        return expertSupervisionSheetRepository.findByExpert_IdOrderByInterventionDateDesc(expertId);
    }

    public List<ExpertSupervisionSheet> getExpertSheetsBySupervisor(Long supervisorId) {
        return expertSupervisionSheetRepository.findBySupervisor_IdOrderByInterventionDateDesc(supervisorId);
    }

    public List<ExpertSupervisionSheet> getAllExpertSheets() {
        return expertSupervisionSheetRepository.findAll();
    }

    @Transactional
    public ExpertSupervisionSheet createExpertSheet(Map<String, Object> data, Long supervisorUserId) {
        User expert = userRepository.findById(Long.valueOf(data.get("expertId").toString()))
                .orElseThrow(() -> new RuntimeException("Expert non trouvé"));
        User supervisor = userRepository.findById(supervisorUserId)
                .orElseThrow(() -> new RuntimeException("Superviseur non trouvé"));

        ExpertSupervisionSheet.ExpertSupervisionSheetBuilder b = ExpertSupervisionSheet.builder()
                .expert(expert)
                .supervisor(supervisor)
                .interventionDate(parseDate(data.getOrDefault("interventionDate", LocalDate.now().toString())))
                .scoreTechnicalMastery(getInt(data, "scoreTechnicalMastery", 0))
                .scoreObservationMethod(getInt(data, "scoreObservationMethod", 0))
                .scoreFindings(getInt(data, "scoreFindings", 0))
                .scoreReportWriting(getInt(data, "scoreReportWriting", 0))
                .scoreCommunication(getInt(data, "scoreCommunication", 0))
                .scoreImpartiality(getInt(data, "scoreImpartiality", 0))
                .scoreDiplomacy(getInt(data, "scoreDiplomacy", 0))
                .verdict((String) data.get("verdict"))
                .strengths((String) data.get("strengths"))
                .improvements((String) data.get("improvements"))
                .recommendations((String) data.get("recommendations"))
                .comments((String) data.get("comments"));

        if (data.get("requestId") != null) b.requestId(Long.valueOf(data.get("requestId").toString()));

        ExpertSupervisionSheet sheet = b.build();
        sheet.setScoreGlobal(computeAvgScore(
                sheet.getScoreTechnicalMastery(), sheet.getScoreObservationMethod(),
                sheet.getScoreFindings(), sheet.getScoreReportWriting(),
                sheet.getScoreCommunication(), sheet.getScoreImpartiality(),
                sheet.getScoreDiplomacy()));

        ExpertSupervisionSheet saved = expertSupervisionSheetRepository.save(sheet);

        // Update last activity for expert qualifications
        markActivity(expert.getId());
        return saved;
    }

    // ==================== FOR 65-1 / 65-6 (Évaluateur monitoring) ====================

    public List<EvaluatorMonitoringSheet> getMonitoringByEvaluator(Long evaluatorId) {
        return evaluatorMonitoringSheetRepository.findByEvaluator_IdOrderByCycleEndDateDesc(evaluatorId);
    }

    public List<EvaluatorMonitoringSheet> getAllMonitoringSheets() {
        return evaluatorMonitoringSheetRepository.findAll();
    }

    @Transactional
    public EvaluatorMonitoringSheet createMonitoringSheet(Map<String, Object> data, Long filledByUserId) {
        User evaluator = userRepository.findById(Long.valueOf(data.get("evaluatorId").toString()))
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé"));
        User filledBy = userRepository.findById(filledByUserId).orElse(null);

        Qualification qualification = null;
        if (data.get("qualificationId") != null) {
            qualification = qualificationRepository.findById(Long.valueOf(data.get("qualificationId").toString()))
                    .orElse(null);
        }

        boolean isPermanent = Boolean.TRUE.equals(data.get("isPermanent"));

        EvaluatorMonitoringSheet sheet = EvaluatorMonitoringSheet.builder()
                .evaluator(evaluator)
                .qualification(qualification)
                .filledBy(filledBy)
                .isPermanent(isPermanent)
                .cycleStartDate(parseDate(data.get("cycleStartDate")))
                .cycleEndDate(parseDate(data.getOrDefault("cycleEndDate", LocalDate.now().toString())))
                .totalMissionsInCycle(getInt(data, "totalMissionsInCycle", 0))
                .lastObservationDate(parseDate(data.get("lastObservationDate")))
                .lastRecyclingDate(parseDate(data.get("lastRecyclingDate")))
                .recyclingParticipations(getInt(data, "recyclingParticipations", 0))
                .avgObservationScore(getDouble(data, "avgObservationScore"))
                .avgSatisfactionScore(getDouble(data, "avgSatisfactionScore"))
                .proposedDecision((String) data.get("proposedDecision"))
                .strengths((String) data.get("strengths"))
                .areasForImprovement((String) data.get("areasForImprovement"))
                .justification((String) data.get("justification"))
                .recommendations((String) data.get("recommendations"))
                .validatedByDirection(false)
                .build();

        return evaluatorMonitoringSheetRepository.save(sheet);
    }

    @Transactional
    public EvaluatorMonitoringSheet validateMonitoringSheet(Long id) {
        EvaluatorMonitoringSheet sheet = evaluatorMonitoringSheetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fiche non trouvée"));
        sheet.setValidatedByDirection(true);
        sheet.setValidatedDate(LocalDate.now());
        return evaluatorMonitoringSheetRepository.save(sheet);
    }

    // ==================== EXTENSIONS DE COMPÉTENCES (§5.6) ====================

    public List<CompetenceExtension> getAllExtensions() {
        return competenceExtensionRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<CompetenceExtension> getExtensionsByEvaluator(Long evaluatorId) {
        return competenceExtensionRepository.findByEvaluator_IdOrderByCreatedAtDesc(evaluatorId);
    }

    @Transactional
    public CompetenceExtension requestExtension(Map<String, Object> data) {
        User evaluator = userRepository.findById(Long.valueOf(data.get("evaluatorId").toString()))
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé"));

        CompetenceExtension.CompetenceExtensionBuilder b = CompetenceExtension.builder()
                .evaluator(evaluator)
                .extensionType((String) data.getOrDefault("extensionType", "DOMAIN_EXTENSION"))
                .requestedDomainsJson((String) data.get("requestedDomainsJson"))
                .requestedStandardsJson((String) data.get("requestedStandardsJson"))
                .justification((String) data.get("justification"))
                .evidenceDocumentsJson((String) data.get("evidenceDocumentsJson"))
                .status("REQUESTED");

        if (data.get("qualificationId") != null) {
            Qualification q = qualificationRepository.findById(Long.valueOf(data.get("qualificationId").toString()))
                    .orElse(null);
            b.qualification(q);
            if (q != null) b.currentRole(q.getQualifiedRole());
        }

        return competenceExtensionRepository.save(b.build());
    }

    @Transactional
    public CompetenceExtension reviewExtension(Long id, String newStatus, String reviewNotes, Long reviewedByUserId) {
        CompetenceExtension ext = competenceExtensionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        ext.setStatus(newStatus);
        ext.setReviewNotes(reviewNotes);
        if (reviewedByUserId != null) {
            ext.setReviewedBy(userRepository.findById(reviewedByUserId).orElse(null));
        }
        ext.setReviewedDate(LocalDate.now());
        if ("APPROVED".equals(newStatus) || "REJECTED".equals(newStatus)) {
            ext.setDecisionDate(LocalDate.now());
        }

        notificationService.createNotification(
                ext.getEvaluator().getId(),
                "Mise à jour de votre demande d'extension",
                "Statut : " + newStatus + (reviewNotes != null ? " — " + reviewNotes : ""),
                "REJECTED".equals(newStatus) ? "warning" : "info"
        );

        return competenceExtensionRepository.save(ext);
    }

    // ==================== BULLETINS D'INFORMATION (§5.6) ====================

    public List<RegularInfoBulletin> getAllBulletins() {
        return regularInfoBulletinRepository.findAllByOrderByPublishedDateDesc();
    }

    @Transactional
    public RegularInfoBulletin createBulletin(Map<String, Object> data, Long publishedByUserId) {
        User publisher = userRepository.findById(publishedByUserId).orElse(null);

        RegularInfoBulletin bulletin = RegularInfoBulletin.builder()
                .title((String) data.get("title"))
                .type((String) data.getOrDefault("type", "OTHER"))
                .content((String) data.get("content"))
                .audience((String) data.getOrDefault("audience", "ALL"))
                .referencesJson((String) data.get("referencesJson"))
                .externalLink((String) data.get("externalLink"))
                .forumDate(parseDate(data.get("forumDate")))
                .publishedDate(LocalDate.now())
                .publishedBy(publisher)
                .emailDispatched(false)
                .build();

        return regularInfoBulletinRepository.save(bulletin);
    }

    @Transactional
    public RegularInfoBulletin dispatchBulletin(Long id) {
        RegularInfoBulletin b = regularInfoBulletinRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bulletin non trouvé"));
        // Notifier les évaluateurs/experts (ALL pour simplifier)
        List<User> recipients = userRepository.findAll();
        for (User u : recipients) {
            if (u.getRole() == UserRole.EXPERT || u.getRole() == UserRole.ET ||
                u.getRole() == UserRole.EQ || u.getRole() == UserRole.REE ||
                u.getRole() == UserRole.SUP) {
                notificationService.createNotification(
                        u.getId(),
                        "Information ALGERAC : " + b.getTitle(),
                        b.getContent() != null && b.getContent().length() > 200 ?
                                b.getContent().substring(0, 200) + "..." : b.getContent(),
                        "info"
                );
            }
        }
        b.setEmailDispatched(true);
        b.setEmailDispatchedAt(LocalDateTime.now());
        return regularInfoBulletinRepository.save(b);
    }

    // ==================== INACTIVITÉ & REQUALIFICATION (§5.5) ====================

    /** Marque l'activité du jour sur toutes les qualifications actives de l'utilisateur. */
    @Transactional
    public void markActivity(Long evaluatorId) {
        List<Qualification> qs = qualificationRepository.findByEvaluator_Id(evaluatorId);
        for (Qualification q : qs) {
            if (q.getStatus() == QualificationStatus.QUALIFIED || q.getStatus() == QualificationStatus.RENEWED) {
                q.setLastActivityDate(LocalDate.now());
                if (Boolean.TRUE.equals(q.getRequalificationRequired())) {
                    q.setRequalificationRequired(false);
                    q.setInactivityNoticeDate(null);
                }
                qualificationRepository.save(q);
            }
        }
    }

    public List<Qualification> getInactiveQualifications() {
        return qualificationRepository.findAll().stream()
                .filter(q -> Boolean.TRUE.equals(q.getRequalificationRequired()))
                .toList();
    }

    @Transactional
    public Qualification triggerRequalification(Long qualificationId) {
        Qualification q = qualificationRepository.findById(qualificationId)
                .orElseThrow(() -> new RuntimeException("Qualification non trouvée"));
        q.setRequalificationRequired(true);
        q.setInactivityNoticeDate(LocalDate.now());
        q.setStatus(QualificationStatus.PRACTICE_PHASE); // doit refaire évaluation complète sous supervision
        qualificationRepository.save(q);

        notificationService.createNotification(
                q.getEvaluator().getId(),
                "Requalification requise",
                "Suite à une période d'inactivité ≥ 1 an, vous devez réaliser une évaluation complète sous supervision (PRO 06 §5.5).",
                "warning"
        );
        return q;
    }

    /** Job quotidien : détecte les qualifications inactives ≥ 1 an et déclenche la requalification. */
    @Scheduled(cron = "0 0 3 * * *") // 3 AM tous les jours
    @Transactional
    public void detectInactivity() {
        log.info("[Scheduler] Détection inactivité ≥ 1 an...");
        LocalDate threshold = LocalDate.now().minusYears(1);
        List<Qualification> active = qualificationRepository.findByStatusIn(
                List.of(QualificationStatus.QUALIFIED, QualificationStatus.RENEWED));
        int triggered = 0;
        for (Qualification q : active) {
            LocalDate ref = q.getLastActivityDate() != null ? q.getLastActivityDate() : q.getQualificationDate();
            if (ref != null && ref.isBefore(threshold) && !Boolean.TRUE.equals(q.getRequalificationRequired())) {
                q.setRequalificationRequired(true);
                q.setInactivityNoticeDate(LocalDate.now());
                qualificationRepository.save(q);
                notificationService.createNotification(
                        q.getEvaluator().getId(),
                        "Requalification requise",
                        "Inactivité ≥ 1 an détectée. Une évaluation complète sous supervision est nécessaire.",
                        "warning"
                );
                triggered++;
            }
        }
        log.info("[Scheduler] {} requalifications déclenchées", triggered);
    }

    // ==================== QUALIFICATION SUP (§5.2) ====================

    /** Vérifie les critères et octroie le rôle SUP. */
    @Transactional
    public User qualifyAsSupervisor(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Vérifier qu'il est REE/ET qualifié avec ≥3 missions
        boolean eligible = qualificationRepository.findByEvaluator_Id(userId).stream()
                .anyMatch(q -> (q.getQualifiedRole() == TeamRole.REE || q.getQualifiedRole() == TeamRole.ET)
                        && (q.getStatus() == QualificationStatus.QUALIFIED || q.getStatus() == QualificationStatus.RENEWED)
                        && (q.getMissionsCompletedCurrentCycle() != null && q.getMissionsCompletedCurrentCycle() >= 3));
        if (!eligible) {
            throw new RuntimeException("Critères non remplis : statut REE/ET qualifié avec ≥ 3 évaluations requis (PRO 06 §5.2)");
        }

        // Ajouter le rôle SUP
        Set<UserRole> all = new LinkedHashSet<>(user.getAllRoles());
        all.add(UserRole.SUP);
        user.setRoles(String.join(",", all.stream().map(Enum::name).toList()));
        userRepository.save(user);

        // Créer une qualification SUP
        Qualification sup = Qualification.builder()
                .evaluator(user)
                .qualifiedRole(TeamRole.SUP)
                .status(QualificationStatus.QUALIFIED)
                .qualificationDate(LocalDate.now())
                .expiryDate(LocalDate.now().plusYears(3))
                .employmentType(role == null ? "EXTERNAL" : role)
                .build();
        qualificationRepository.save(sup);

        notificationService.createNotification(userId,
                "Qualification Superviseur (SUP)",
                "Vous êtes désormais qualifié comme superviseur (LIS 09 — PRO 06 §5.2).",
                "success");
        return user;
    }

    public List<User> getSupervisorsList() {
        return userRepository.findAll().stream()
                .filter(u -> u.hasRole(UserRole.SUP))
                .toList();
    }

    // ==================== HELPERS ====================

    private LocalDate parseDate(Object o) {
        if (o == null) return null;
        try {
            return LocalDate.parse(o.toString());
        } catch (Exception e) { return null; }
    }

    private int getInt(Map<String, Object> data, String key, int def) {
        Object v = data.get(key);
        if (v == null) return def;
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return def; }
    }

    private Double getDouble(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }

    private Double computeAvgScore(Integer... scores) {
        int sum = 0, count = 0;
        for (Integer s : scores) {
            if (s != null && s > 0) { sum += s; count++; }
        }
        return count == 0 ? 0.0 : (double) sum / count;
    }
}
