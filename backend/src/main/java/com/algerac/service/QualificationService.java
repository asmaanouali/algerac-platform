package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class QualificationService {

    @Autowired
    private QualificationRepository qualificationRepository;

    @Autowired
    private ObservationReportRepository observationReportRepository;

    @Autowired
    private OECSatisfactionRepository oecSatisfactionRepository;

    @Autowired
    private QualificationCommissionRepository commissionRepository;

    @Autowired
    private TrainingRecordRepository trainingRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // ==================== QUALIFICATIONS ====================

    public List<Qualification> getAllQualifications() {
        return qualificationRepository.findAll();
    }

    public Qualification getQualificationById(Long id) {
        return qualificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Qualification non trouvée: " + id));
    }

    public List<Qualification> getQualificationsByEvaluator(Long evaluatorId) {
        return qualificationRepository.findByEvaluator_Id(evaluatorId);
    }

    public List<Qualification> getQualificationsByStatus(QualificationStatus status) {
        return qualificationRepository.findByStatus(status);
    }

    public List<Qualification> getActiveQualifications() {
        return qualificationRepository.findByStatusIn(
                List.of(QualificationStatus.QUALIFIED, QualificationStatus.RENEWED));
    }

    public List<Qualification> getExpiringQualifications(int daysAhead) {
        LocalDate now = LocalDate.now();
        LocalDate deadline = now.plusDays(daysAhead);
        return qualificationRepository.findByExpiryDateBetween(now, deadline);
    }

    public List<Qualification> getExpiredQualifications() {
        return qualificationRepository.findByExpiryDateBefore(LocalDate.now());
    }

    @Transactional
    public Qualification createQualification(Long evaluatorId, TeamRole qualifiedRole,
                                             String standardsJson, String domainsJson,
                                             Boolean fromOtherBody, String sourceBody) {
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé: " + evaluatorId));

        Qualification q = Qualification.builder()
                .evaluator(evaluator)
                .qualifiedRole(qualifiedRole)
                .qualifiedStandardsJson(standardsJson)
                .qualifiedDomainsJson(domainsJson)
                .status(fromOtherBody != null && fromOtherBody
                        ? QualificationStatus.PENDING_COMMISSION
                        : QualificationStatus.PENDING_TRAINING)
                .fromOtherAccreditationBody(fromOtherBody)
                .sourceAccreditationBody(sourceBody)
                .lightProcessApplied(fromOtherBody != null && fromOtherBody)
                .build();

        Qualification saved = qualificationRepository.save(q);
        log.info("Qualification créée pour l'évaluateur {} (rôle: {})", evaluator.getFullName(), qualifiedRole);
        return saved;
    }

    @Transactional
    public Qualification updateQualificationStatus(Long qualificationId, QualificationStatus newStatus) {
        Qualification q = getQualificationById(qualificationId);
        QualificationStatus oldStatus = q.getStatus();
        q.setStatus(newStatus);

        if (newStatus == QualificationStatus.QUALIFIED || newStatus == QualificationStatus.RENEWED) {
            q.setQualificationDate(LocalDate.now());
            q.setExpiryDate(LocalDate.now().plusYears(3));
            if (newStatus == QualificationStatus.RENEWED) {
                q.setLastRenewalDate(LocalDate.now());
            }
        }

        Qualification saved = qualificationRepository.save(q);
        log.info("Qualification {} : statut {} → {}", qualificationId, oldStatus, newStatus);
        return saved;
    }

    @Transactional
    public Qualification recordTrainingResult(Long qualificationId, Double examScore) {
        Qualification q = getQualificationById(qualificationId);
        q.setTrainingExamScore(examScore);
        q.setTrainingCompletedDate(LocalDate.now());

        if (examScore >= 70.0) {
            q.setStatus(QualificationStatus.TRAINING_COMPLETED);
            log.info("Qualification {} : examen réussi ({}/100)", qualificationId, examScore);
        } else {
            q.setStatus(QualificationStatus.TRAINING_FAILED);
            log.info("Qualification {} : examen échoué ({}/100)", qualificationId, examScore);
        }
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification advanceToObserverPhase(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        if (q.getStatus() != QualificationStatus.TRAINING_COMPLETED) {
            throw new RuntimeException("La formation doit être complétée avant la phase d'observation");
        }
        q.setStatus(QualificationStatus.OBSERVER_PHASE);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification advanceToPracticePhase(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        if (q.getObserverMissionsCompleted() < 1) {
            throw new RuntimeException("Au moins 1 mission en tant qu'observateur requise");
        }
        q.setStatus(QualificationStatus.PRACTICE_PHASE);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification incrementObserverMissions(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        q.setObserverMissionsCompleted(q.getObserverMissionsCompleted() + 1);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification incrementSupervisedMissions(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        q.setSupervisedMissionsCompleted(q.getSupervisedMissionsCompleted() + 1);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification submitToCommission(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        // Pour ET/EXP: min 2 missions supervisées (ou 1 si expérience solide)
        // Pour RE: min 5 missions comme ET + observation en tant que RE stagiaire
        q.setStatus(QualificationStatus.PENDING_COMMISSION);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification applyCommissionDecision(Long qualificationId, QualificationDecisionType decision,
                                                  Long commissionId, String notes) {
        Qualification q = getQualificationById(qualificationId);
        q.setLastDecisionType(decision);
        q.setLastDecisionDate(LocalDate.now());
        q.setLastDecisionNotes(notes);

        if (commissionId != null) {
            QualificationCommission commission = commissionRepository.findById(commissionId)
                    .orElse(null);
            q.setCommission(commission);
        }

        switch (decision) {
            case QUALIFICATION_INITIALE:
                q.setStatus(QualificationStatus.QUALIFIED);
                q.setQualificationDate(LocalDate.now());
                q.setExpiryDate(LocalDate.now().plusYears(3));
                q.setMissionsCompletedCurrentCycle(0);
                break;
            case RENOUVELLEMENT:
                q.setStatus(QualificationStatus.RENEWED);
                q.setLastRenewalDate(LocalDate.now());
                q.setExpiryDate(LocalDate.now().plusYears(3));
                q.setMissionsCompletedCurrentCycle(0);
                break;
            case EXTENSION:
                // Keep QUALIFIED status, update domains
                break;
            case AVERTISSEMENT:
                // Keep current status, just record decision
                break;
            case SUSPENSION_TEMPORAIRE:
                q.setStatus(QualificationStatus.SUSPENDED);
                q.setSuspensionDate(LocalDate.now());
                q.setSuspensionReason(notes);
                break;
            case RETRAIT_DEFINITIF:
                q.setStatus(QualificationStatus.WITHDRAWN);
                q.setWithdrawalDate(LocalDate.now());
                q.setWithdrawalReason(notes);
                break;
            case MISE_A_NIVEAU:
                q.setStatus(QualificationStatus.RENEWAL_PENDING);
                break;
        }

        Qualification saved = qualificationRepository.save(q);

        // Notify evaluator
        notificationService.createNotification(
                q.getEvaluator().getId(),
                "Décision de la Commission de Qualification",
                "La Commission de Qualification a rendu sa décision : " + decision.name() +
                        (notes != null ? " - " + notes : ""),
                decision == QualificationDecisionType.RETRAIT_DEFINITIF ? "error" :
                        decision == QualificationDecisionType.SUSPENSION_TEMPORAIRE ? "warning" : "info"
        );

        return saved;
    }

    @Transactional
    public Qualification signCollaborationContract(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        q.setCollaborationContractSigned(true);
        q.setCollaborationContractDate(LocalDate.now());
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification recordMissionCompleted(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        q.setMissionsCompletedCurrentCycle(q.getMissionsCompletedCurrentCycle() + 1);
        return qualificationRepository.save(q);
    }

    @Transactional
    public Qualification recordRecyclingParticipation(Long qualificationId) {
        Qualification q = getQualificationById(qualificationId);
        q.setRecyclingParticipations(q.getRecyclingParticipations() + 1);
        q.setLastRecyclingDate(LocalDate.now());
        return qualificationRepository.save(q);
    }

    // ==================== OBSERVATION REPORTS (FOR 71) ====================

    public List<ObservationReport> getAllObservationReports() {
        return observationReportRepository.findAll();
    }

    public ObservationReport getObservationReportById(Long id) {
        return observationReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fiche d'observation non trouvée: " + id));
    }

    public List<ObservationReport> getObservationsByEvaluator(Long evaluatorId) {
        return observationReportRepository.findByEvaluator_IdOrderByObservationDateDesc(evaluatorId);
    }

    @Transactional
    public ObservationReport createObservationReport(Long evaluatorId, Long observerId,
                                                      Long requestId, Long qualificationId,
                                                      Map<String, Object> data) {
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé"));
        User observer = userRepository.findById(observerId)
                .orElseThrow(() -> new RuntimeException("Observateur non trouvé"));

        ObservationReport.ObservationReportBuilder builder = ObservationReport.builder()
                .evaluator(evaluator)
                .observer(observer)
                .observationDate(LocalDate.parse((String) data.getOrDefault("observationDate", LocalDate.now().toString())))
                .observationType((String) data.getOrDefault("observationType", "SUPERVISION_PERIODIQUE"));

        if (requestId != null) {
            // Set request if provided
        }
        if (qualificationId != null) {
            Qualification qual = qualificationRepository.findById(qualificationId).orElse(null);
            builder.qualification(qual);
        }

        // Savoir-faire scores
        builder.scoreMaitriseTechnique(getIntValue(data, "scoreMaitriseTechnique"));
        builder.scoreRigueurExamen(getIntValue(data, "scoreRigueurExamen"));
        builder.scorePertinenceConstats(getIntValue(data, "scorePertinenceConstats"));
        builder.scoreRedactionRapports(getIntValue(data, "scoreRedactionRapports"));
        builder.scoreConnaissanceNormes(getIntValue(data, "scoreConnaissanceNormes"));

        // Savoir-être scores
        builder.scoreComportement(getIntValue(data, "scoreComportement"));
        builder.scoreEcoute(getIntValue(data, "scoreEcoute"));
        builder.scoreImpartialite(getIntValue(data, "scoreImpartialite"));
        builder.scoreGestionTemps(getIntValue(data, "scoreGestionTemps"));
        builder.scoreDiplomatie(getIntValue(data, "scoreDiplomatie"));

        // Verdict
        String verdictStr = (String) data.get("verdict");
        if (verdictStr != null) {
            builder.verdict(ObservationVerdict.valueOf(verdictStr));
        }

        builder.pointsForts((String) data.get("pointsForts"));
        builder.pointsAmeliorer((String) data.get("pointsAmeliorer"));
        builder.recommandations((String) data.get("recommandations"));
        builder.commentairesGeneraux((String) data.get("commentairesGeneraux"));
        builder.conditionsReserve((String) data.get("conditionsReserve"));

        ObservationReport report = builder.build();
        report.calculateGlobalScore();

        ObservationReport saved = observationReportRepository.save(report);
        log.info("Fiche d'observation FOR 71 créée pour {} par {}", evaluator.getFullName(), observer.getFullName());

        // Update qualification observation tracking
        if (qualificationId != null) {
            Qualification qual = qualificationRepository.findById(qualificationId).orElse(null);
            if (qual != null) {
                qual.setLastObservationDate(LocalDate.now());
                qualificationRepository.save(qual);
            }
        }

        return saved;
    }

    // ==================== OEC SATISFACTION (FOR 21) ====================

    public List<OECSatisfaction> getAllSatisfactionSurveys() {
        return oecSatisfactionRepository.findAll();
    }

    public List<OECSatisfaction> getSatisfactionByEvaluator(Long evaluatorId) {
        return oecSatisfactionRepository.findByEvaluator_IdOrderByCreatedAtDesc(evaluatorId);
    }

    @Transactional
    public OECSatisfaction createSatisfactionSurvey(Long requestId, Long oecUserId,
                                                     Long evaluatorId, Map<String, Object> data) {
        OECSatisfaction.OECSatisfactionBuilder builder = OECSatisfaction.builder();

        if (requestId != null) {
            // requestRepository lookup would be needed
        }

        User oecUser = userRepository.findById(oecUserId)
                .orElseThrow(() -> new RuntimeException("Utilisateur OEC non trouvé"));
        builder.oecUser(oecUser);

        if (evaluatorId != null) {
            User evaluator = userRepository.findById(evaluatorId).orElse(null);
            builder.evaluator(evaluator);
        }

        builder.evaluationDate(LocalDate.parse((String) data.getOrDefault("evaluationDate", LocalDate.now().toString())));
        builder.scoreProfessionnalisme(getIntValue(data, "scoreProfessionnalisme"));
        builder.scoreCompetenceTechnique(getIntValue(data, "scoreCompetenceTechnique"));
        builder.scoreImpartialite(getIntValue(data, "scoreImpartialite"));
        builder.scoreCommunication(getIntValue(data, "scoreCommunication"));
        builder.scoreRespectDelais(getIntValue(data, "scoreRespectDelais"));
        builder.scoreClarte(getIntValue(data, "scoreClarte"));
        builder.scoreComportement(getIntValue(data, "scoreComportement"));
        builder.scoreDisponibilite(getIntValue(data, "scoreDisponibilite"));
        builder.commentairesPositifs((String) data.get("commentairesPositifs"));
        builder.commentairesNegatifs((String) data.get("commentairesNegatifs"));
        builder.suggestions((String) data.get("suggestions"));
        builder.satisfactionGlobale((String) data.get("satisfactionGlobale"));

        OECSatisfaction survey = builder.build();
        survey.calculateAverage();

        return oecSatisfactionRepository.save(survey);
    }

    // ==================== COMMISSION DE QUALIFICATION ====================

    public List<QualificationCommission> getAllCommissions() {
        return commissionRepository.findAllByOrderByMeetingDateDesc();
    }

    public QualificationCommission getCommissionById(Long id) {
        return commissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commission non trouvée: " + id));
    }

    @Transactional
    public QualificationCommission createCommission(Map<String, Object> data) {
        String refNumber = generateCommissionReference();

        QualificationCommission commission = QualificationCommission.builder()
                .referenceNumber(refNumber)
                .meetingDate(LocalDate.parse((String) data.get("meetingDate")))
                .meetingTime((String) data.get("meetingTime"))
                .meetingLocation((String) data.getOrDefault("meetingLocation", "Siège ALGERAC"))
                .agendaJson((String) data.get("agendaJson"))
                .notes((String) data.get("notes"))
                .status(CommissionStatus.PLANNED)
                .build();

        Long presidentId = getLongValue(data, "presidentId");
        if (presidentId != null) {
            commission.setPresident(userRepository.findById(presidentId).orElse(null));
        }

        Long rapporteurId = getLongValue(data, "rapporteurId");
        if (rapporteurId != null) {
            commission.setRapporteur(userRepository.findById(rapporteurId).orElse(null));
        }

        return commissionRepository.save(commission);
    }

    @Transactional
    public QualificationCommission sendConvocation(Long commissionId) {
        QualificationCommission commission = getCommissionById(commissionId);
        commission.setStatus(CommissionStatus.CONVENED);
        commission.setConvocationSent(true);
        commission.setConvocationSentAt(LocalDateTime.now());
        log.info("Convocation FOR 105 envoyée pour la commission {}", commission.getReferenceNumber());
        return commissionRepository.save(commission);
    }

    @Transactional
    public QualificationCommission startSession(Long commissionId) {
        QualificationCommission commission = getCommissionById(commissionId);
        commission.setStatus(CommissionStatus.IN_SESSION);
        return commissionRepository.save(commission);
    }

    @Transactional
    public QualificationCommission completeCommission(Long commissionId, String minutesText,
                                                       String decisionsJson, String participantsJson) {
        QualificationCommission commission = getCommissionById(commissionId);
        commission.setStatus(CommissionStatus.COMPLETED);
        commission.setMinutesText(minutesText);
        commission.setDecisionsJson(decisionsJson);
        commission.setParticipantsJson(participantsJson);
        commission.setPvSigned(true);
        commission.setPvSignedAt(LocalDateTime.now());
        log.info("Commission {} terminée, PV FOR 106 rédigé", commission.getReferenceNumber());
        return commissionRepository.save(commission);
    }

    // ==================== TRAINING RECORDS ====================

    public List<TrainingRecord> getTrainingByEvaluator(Long evaluatorId) {
        return trainingRecordRepository.findByEvaluator_IdOrderByStartDateDesc(evaluatorId);
    }

    @Transactional
    public TrainingRecord createTrainingRecord(Long evaluatorId, Map<String, Object> data) {
        User evaluator = userRepository.findById(evaluatorId)
                .orElseThrow(() -> new RuntimeException("Évaluateur non trouvé"));

        TrainingRecord record = TrainingRecord.builder()
                .evaluator(evaluator)
                .trainingType((String) data.getOrDefault("trainingType", "INITIALE"))
                .title((String) data.get("title"))
                .description((String) data.get("description"))
                .normReference((String) data.get("normReference"))
                .startDate(data.get("startDate") != null ? LocalDate.parse((String) data.get("startDate")) : null)
                .endDate(data.get("endDate") != null ? LocalDate.parse((String) data.get("endDate")) : null)
                .durationHours(getIntValue(data, "durationHours"))
                .trainerName((String) data.get("trainerName"))
                .trainerOrganization((String) data.get("trainerOrganization"))
                .recordStatus((String) data.getOrDefault("recordStatus", "PLANNED"))
                .notes((String) data.get("notes"))
                .build();

        return trainingRecordRepository.save(record);
    }

    @Transactional
    public TrainingRecord recordExamResult(Long trainingId, Double score) {
        TrainingRecord record = trainingRecordRepository.findById(trainingId)
                .orElseThrow(() -> new RuntimeException("Formation non trouvée"));
        record.setExamScore(score);
        record.setExamPassed(score >= record.getExamPassThreshold());
        record.setRecordStatus(record.getExamPassed() ? "COMPLETED" : "FAILED");
        return trainingRecordRepository.save(record);
    }

    // ==================== STATISTICS / KPIs ====================

    public Map<String, Object> getQualificationStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQualifications", qualificationRepository.count());
        stats.put("qualified", qualificationRepository.countByStatus(QualificationStatus.QUALIFIED));
        stats.put("renewed", qualificationRepository.countByStatus(QualificationStatus.RENEWED));
        stats.put("pendingCommission", qualificationRepository.countByStatus(QualificationStatus.PENDING_COMMISSION));
        stats.put("pendingTraining", qualificationRepository.countByStatus(QualificationStatus.PENDING_TRAINING));
        stats.put("trainingInProgress", qualificationRepository.countByStatus(QualificationStatus.TRAINING_IN_PROGRESS));
        stats.put("observerPhase", qualificationRepository.countByStatus(QualificationStatus.OBSERVER_PHASE));
        stats.put("practicePhase", qualificationRepository.countByStatus(QualificationStatus.PRACTICE_PHASE));
        stats.put("suspended", qualificationRepository.countByStatus(QualificationStatus.SUSPENDED));
        stats.put("withdrawn", qualificationRepository.countByStatus(QualificationStatus.WITHDRAWN));
        stats.put("expiringIn90Days", getExpiringQualifications(90).size());
        stats.put("expired", getExpiredQualifications().size());
        stats.put("totalObservations", observationReportRepository.count());
        stats.put("totalSatisfactionSurveys", oecSatisfactionRepository.count());
        stats.put("plannedCommissions", commissionRepository.countByStatus(CommissionStatus.PLANNED));
        stats.put("completedCommissions", commissionRepository.countByStatus(CommissionStatus.COMPLETED));
        return stats;
    }

    // ==================== EVALUATOR DIRECTORY ====================

    public List<Map<String, Object>> getEvaluatorDirectory() {
        List<Qualification> activeQualifications = qualificationRepository.findByStatusIn(
                List.of(QualificationStatus.QUALIFIED, QualificationStatus.RENEWED));

        return activeQualifications.stream().map(q -> {
            Map<String, Object> entry = new HashMap<>();
            User eval = q.getEvaluator();
            entry.put("id", q.getId());
            entry.put("evaluatorId", eval.getId());
            entry.put("fullName", eval.getFullName());
            entry.put("email", eval.getEmail());
            entry.put("phone", eval.getPhone());
            entry.put("qualifiedRole", q.getQualifiedRole());
            entry.put("qualifiedStandards", q.getQualifiedStandardsJson());
            entry.put("qualifiedDomains", q.getQualifiedDomainsJson());
            entry.put("qualificationDate", q.getQualificationDate());
            entry.put("expiryDate", q.getExpiryDate());
            entry.put("missionsCurrentCycle", q.getMissionsCompletedCurrentCycle());
            entry.put("lastObservationDate", q.getLastObservationDate());
            entry.put("lastRecyclingDate", q.getLastRecyclingDate());
            entry.put("status", q.getStatus());
            return entry;
        }).collect(Collectors.toList());
    }

    // ==================== HELPERS ====================

    private Integer getIntValue(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private Long getLongValue(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val instanceof Long) return (Long) val;
        if (val instanceof Number) return ((Number) val).longValue();
        if (val instanceof String) {
            try { return Long.parseLong((String) val); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private String generateCommissionReference() {
        int year = LocalDate.now().getYear();
        long count = commissionRepository.count() + 1;
        return String.format("CQ-%d-%03d", year, count);
    }
}
