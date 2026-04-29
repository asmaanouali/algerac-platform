package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.SamplingPlanRepository;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.SatelliteSiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * PRO_13-1 : Service de gestion des plans d'échantillonnage
 * pour les évaluations de laboratoires et d'inspection.
 *
 * Couvre:
 * - §5.1 Évaluation initiale et d'extension (tous sites, toute portée, tout personnel)
 * - §5.2 Surveillance et renouvellement (échantillonnage basé sur le risque)
 * - §5.3 Ajustement de l'échantillon selon les risques identifiés
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SamplingService {

    private final SamplingPlanRepository samplingPlanRepository;
    private final RequestRepository requestRepository;
    private final SatelliteSiteRepository satelliteSiteRepository;

    private static final AtomicLong samplingSequence = new AtomicLong(System.currentTimeMillis() % 10000);

    /**
     * Créer un plan d'échantillonnage complet pour une demande
     */
    @Transactional
    public SamplingPlan createSamplingPlan(Long requestId, Map<String, Object> data, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée: " + requestId));

        String planCode = "SAMP-" + Year.now().getValue() + "-" +
                String.format("%04d", samplingSequence.incrementAndGet() % 10000);

        RequestType assessmentType = request.getType() != null ? request.getType() : RequestType.INITIAL;

        SamplingPlan.SamplingPlanBuilder builder = SamplingPlan.builder()
                .request(request)
                .planCode(planCode)
                .planType(SamplingPlanType.valueOf(getString(data, "planType", "LABORATORY")))
                .assessmentType(assessmentType)
                .status(SamplingPlanStatus.DRAFT)
                .createdBy(currentUser);

        // Scope sampling (§5.1.b / §5.2.b)
        builder.methodology(getString(data, "methodology", null));
        builder.totalMethodsInScope(getInt(data, "totalMethods"));
        builder.selectedMethodsCount(getInt(data, "selectedMethods"));
        builder.selectedMethods(getString(data, "selectedMethodsDetail", null));
        builder.numberOfAssessmentsInCycle(getInt(data, "numberOfAssessmentsInCycle"));
        builder.accreditationCycleYears(getInt(data, "accreditationCycleYears"));

        // Site sampling (§5.1.a / §5.2.a)
        builder.totalSitesInScope(getInt(data, "totalSites"));
        builder.selectedSitesCount(getInt(data, "selectedSites"));
        builder.selectedSites(getString(data, "selectedSitesDetail", null));
        builder.headquartersIncluded(getBool(data, "headquartersIncluded"));

        // Personnel sampling (§5.1.c / §5.2.c)
        builder.totalPersonnelCount(getInt(data, "totalPersonnelCount"));
        builder.selectedPersonnelCount(getInt(data, "selectedPersonnelCount"));
        builder.selectedPersonnel(getString(data, "selectedPersonnel", null));
        builder.totalSignatories(getInt(data, "totalSignatories"));
        builder.selectedSignatories(getInt(data, "selectedSignatories"));
        builder.totalInspectors(getInt(data, "totalInspectors"));
        builder.selectedInspectors(getInt(data, "selectedInspectors"));
        builder.totalTechnicians(getInt(data, "totalTechnicians"));
        builder.selectedTechnicians(getInt(data, "selectedTechnicians"));
        builder.allCompetenceFilesReviewed(getBool(data, "allCompetenceFilesReviewed"));
        builder.newRecruitsIncluded(getBool(data, "newRecruitsIncluded"));
        builder.newClearancesIncluded(getBool(data, "newClearancesIncluded"));

        // Criteria & risk (§5.3)
        builder.selectionCriteria(getString(data, "selectionCriteria", null));
        builder.riskFactors(getString(data, "riskFactors", null));
        builder.riskAnalysisNotes(getString(data, "riskAnalysisNotes", null));

        // Justification & coverage
        builder.justification(getString(data, "justification", null));
        builder.coversAllDomains(getBool(data, "coversAllDomains"));
        builder.coversKeyPersonnel(getBool(data, "coversKeyPersonnel"));
        builder.coverageNotes(getString(data, "coverageNotes", null));

        // Historical references (§5.2)
        builder.internalAuditResults(getString(data, "internalAuditResults", null));
        builder.managementReviewResults(getString(data, "managementReviewResults", null));
        builder.findingsHistory(getString(data, "findingsHistory", null));

        SamplingPlan plan = builder.build();

        // §5.1 Initial/Extension: validate full coverage
        if (assessmentType == RequestType.INITIAL || assessmentType == RequestType.EXTENSION) {
            validateInitialPlan(plan, request);
        }
        // §5.2 Surveillance/Renewal: validate HQ is included
        if (assessmentType == RequestType.SURVEILLANCE || assessmentType == RequestType.RENOUVELLEMENT) {
            validateSurveillancePlan(plan, request);
        }

        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} créé pour la demande {} (type: {})",
                planCode, request.getReferenceNumber(), assessmentType);
        return plan;
    }

    /**
     * Mettre à jour un plan en brouillon ou renvoyé pour modifications
     */
    @Transactional
    public SamplingPlan updatePlan(Long planId, Map<String, Object> data, User currentUser) {
        SamplingPlan plan = getPlanOrThrow(planId);
        if (plan.getStatus() != SamplingPlanStatus.DRAFT &&
            plan.getStatus() != SamplingPlanStatus.CD_CHANGES_REQUESTED) {
            throw new RuntimeException("Le plan ne peut être modifié dans son état actuel: " + plan.getStatus());
        }

        // Scope
        if (data.containsKey("methodology")) plan.setMethodology(getString(data, "methodology", null));
        if (data.containsKey("totalMethods")) plan.setTotalMethodsInScope(getInt(data, "totalMethods"));
        if (data.containsKey("selectedMethods")) plan.setSelectedMethodsCount(getInt(data, "selectedMethods"));
        if (data.containsKey("selectedMethodsDetail")) plan.setSelectedMethods(getString(data, "selectedMethodsDetail", null));
        if (data.containsKey("numberOfAssessmentsInCycle")) plan.setNumberOfAssessmentsInCycle(getInt(data, "numberOfAssessmentsInCycle"));
        if (data.containsKey("accreditationCycleYears")) plan.setAccreditationCycleYears(getInt(data, "accreditationCycleYears"));

        // Sites
        if (data.containsKey("totalSites")) plan.setTotalSitesInScope(getInt(data, "totalSites"));
        if (data.containsKey("selectedSites")) plan.setSelectedSitesCount(getInt(data, "selectedSites"));
        if (data.containsKey("selectedSitesDetail")) plan.setSelectedSites(getString(data, "selectedSitesDetail", null));
        if (data.containsKey("headquartersIncluded")) plan.setHeadquartersIncluded(getBool(data, "headquartersIncluded"));

        // Personnel
        if (data.containsKey("totalPersonnelCount")) plan.setTotalPersonnelCount(getInt(data, "totalPersonnelCount"));
        if (data.containsKey("selectedPersonnelCount")) plan.setSelectedPersonnelCount(getInt(data, "selectedPersonnelCount"));
        if (data.containsKey("selectedPersonnel")) plan.setSelectedPersonnel(getString(data, "selectedPersonnel", null));
        if (data.containsKey("totalSignatories")) plan.setTotalSignatories(getInt(data, "totalSignatories"));
        if (data.containsKey("selectedSignatories")) plan.setSelectedSignatories(getInt(data, "selectedSignatories"));
        if (data.containsKey("totalInspectors")) plan.setTotalInspectors(getInt(data, "totalInspectors"));
        if (data.containsKey("selectedInspectors")) plan.setSelectedInspectors(getInt(data, "selectedInspectors"));
        if (data.containsKey("totalTechnicians")) plan.setTotalTechnicians(getInt(data, "totalTechnicians"));
        if (data.containsKey("selectedTechnicians")) plan.setSelectedTechnicians(getInt(data, "selectedTechnicians"));
        if (data.containsKey("allCompetenceFilesReviewed")) plan.setAllCompetenceFilesReviewed(getBool(data, "allCompetenceFilesReviewed"));
        if (data.containsKey("newRecruitsIncluded")) plan.setNewRecruitsIncluded(getBool(data, "newRecruitsIncluded"));
        if (data.containsKey("newClearancesIncluded")) plan.setNewClearancesIncluded(getBool(data, "newClearancesIncluded"));

        // Criteria & risk
        if (data.containsKey("selectionCriteria")) plan.setSelectionCriteria(getString(data, "selectionCriteria", null));
        if (data.containsKey("riskFactors")) plan.setRiskFactors(getString(data, "riskFactors", null));
        if (data.containsKey("riskAnalysisNotes")) plan.setRiskAnalysisNotes(getString(data, "riskAnalysisNotes", null));

        // Justification & coverage
        if (data.containsKey("justification")) plan.setJustification(getString(data, "justification", null));
        if (data.containsKey("coversAllDomains")) plan.setCoversAllDomains(getBool(data, "coversAllDomains"));
        if (data.containsKey("coversKeyPersonnel")) plan.setCoversKeyPersonnel(getBool(data, "coversKeyPersonnel"));
        if (data.containsKey("coverageNotes")) plan.setCoverageNotes(getString(data, "coverageNotes", null));

        // Historical
        if (data.containsKey("internalAuditResults")) plan.setInternalAuditResults(getString(data, "internalAuditResults", null));
        if (data.containsKey("managementReviewResults")) plan.setManagementReviewResults(getString(data, "managementReviewResults", null));
        if (data.containsKey("findingsHistory")) plan.setFindingsHistory(getString(data, "findingsHistory", null));

        if (plan.getStatus() == SamplingPlanStatus.CD_CHANGES_REQUESTED) {
            plan.setStatus(SamplingPlanStatus.DRAFT);
        }

        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} mis à jour", plan.getPlanCode());
        return plan;
    }

    /**
     * Soumettre le plan au CD pour validation
     */
    @Transactional
    public SamplingPlan submitToCD(Long planId, User currentUser) {
        SamplingPlan plan = getPlanOrThrow(planId);
        if (plan.getStatus() != SamplingPlanStatus.DRAFT &&
            plan.getStatus() != SamplingPlanStatus.CD_CHANGES_REQUESTED) {
            throw new RuntimeException("Le plan n'est pas dans un état permettant la soumission");
        }
        plan.setStatus(SamplingPlanStatus.SUBMITTED_TO_CD);
        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} soumis au CD", plan.getPlanCode());
        return plan;
    }

    /**
     * CD approuve ou demande des modifications
     */
    @Transactional
    public SamplingPlan cdReview(Long planId, boolean approved, String comments, User currentUser) {
        SamplingPlan plan = getPlanOrThrow(planId);
        if (plan.getStatus() != SamplingPlanStatus.SUBMITTED_TO_CD) {
            throw new RuntimeException("Le plan n'est pas en attente de validation CD");
        }

        if (approved) {
            plan.setStatus(SamplingPlanStatus.CD_APPROVED);
            plan.setApprovedBy(currentUser);
            plan.setApprovalDate(LocalDateTime.now());
            plan.setApprovalComments(comments);
            log.info("Plan d'échantillonnage {} approuvé par le CD", plan.getPlanCode());
        } else {
            plan.setStatus(SamplingPlanStatus.CD_CHANGES_REQUESTED);
            plan.setApprovalComments(comments);
            log.info("Modifications demandées sur le plan d'échantillonnage {}", plan.getPlanCode());
        }

        return samplingPlanRepository.save(plan);
    }

    /**
     * Appliquer le plan validé à l'évaluation
     */
    @Transactional
    public SamplingPlan applyPlan(Long planId, User currentUser) {
        SamplingPlan plan = getPlanOrThrow(planId);
        if (plan.getStatus() != SamplingPlanStatus.CD_APPROVED) {
            throw new RuntimeException("Le plan doit être approuvé avant d'être appliqué");
        }

        // Supersede any previously applied plan for the same request
        List<SamplingPlan> existing = samplingPlanRepository.findByRequest_IdAndStatus(
                plan.getRequest().getId(), SamplingPlanStatus.APPLIED);
        for (SamplingPlan old : existing) {
            old.setStatus(SamplingPlanStatus.SUPERSEDED);
            old.setSupersededBy(plan);
            samplingPlanRepository.save(old);
            log.info("Plan {} remplacé par {}", old.getPlanCode(), plan.getPlanCode());
        }

        plan.setStatus(SamplingPlanStatus.APPLIED);
        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} appliqué", plan.getPlanCode());
        return plan;
    }

    /**
     * Archiver un plan
     */
    @Transactional
    public SamplingPlan archivePlan(Long planId, User currentUser) {
        SamplingPlan plan = getPlanOrThrow(planId);
        if (plan.getStatus() == SamplingPlanStatus.ARCHIVED) {
            throw new RuntimeException("Le plan est déjà archivé");
        }
        plan.setStatus(SamplingPlanStatus.ARCHIVED);
        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} archivé", plan.getPlanCode());
        return plan;
    }

    /**
     * Get all sampling plans (for CD dashboard)
     */
    public List<SamplingPlan> getAllPlans() {
        return samplingPlanRepository.findAllByOrderByCreatedAtDesc();
    }

    public SamplingPlan getPlanById(Long planId) {
        return getPlanOrThrow(planId);
    }

    public List<SamplingPlan> getPlansByRequest(Long requestId) {
        return samplingPlanRepository.findByRequest_Id(requestId);
    }

    public List<SamplingPlan> getPlansByStatus(SamplingPlanStatus status) {
        return samplingPlanRepository.findByStatus(status);
    }

    public List<SamplingPlan> getPendingReview() {
        return samplingPlanRepository.findByStatus(SamplingPlanStatus.SUBMITTED_TO_CD);
    }

    /**
     * §5.2.b: Calculate recommended scope sample size for surveillance
     * Formula: totalMethods / numberOfAssessmentsInCycle
     */
    public int calculateRecommendedScopeSampleSize(int totalMethods, int assessmentsInCycle) {
        if (assessmentsInCycle <= 0) return totalMethods;
        return (int) Math.ceil((double) totalMethods / assessmentsInCycle);
    }

    // ---- Validation ----

    private void validateInitialPlan(SamplingPlan plan, AccreditationRequest request) {
        // PRO 26 §5.4 — pour une demande initiale multisites, tous les sites en portée doivent être évalués
        if (Boolean.TRUE.equals(request.getIsMultisite()) && request.getType() == RequestType.INITIAL) {
            long activeInScope = satelliteSiteRepository.countByRequest_IdAndStatus(request.getId(), SatelliteSiteStatus.ACTIVE);
            int requiredTotal = (int) (1 + activeInScope); // 1 = siège
            if (plan.getSelectedSitesCount() == null || plan.getSelectedSitesCount() < requiredTotal) {
                throw new RuntimeException(
                    "PRO 26 §5.4 : pour une demande initiale multisites, tous les sites doivent être évalués (" +
                    "requis: " + requiredTotal + ", sélectionnés: " + plan.getSelectedSitesCount() + ")");
            }
            if (!Boolean.TRUE.equals(plan.getHeadquartersIncluded())) {
                throw new RuntimeException("PRO 26 §5.4 : le siège social doit être inclus dans une évaluation initiale multisites");
            }
        }
        // §5.1.a: All sites must be assessed initially
        if (plan.getTotalSitesInScope() != null && plan.getSelectedSitesCount() != null) {
            if (plan.getSelectedSitesCount() < plan.getTotalSitesInScope()) {
                log.warn("Plan {}: évaluation initiale — tous les sites doivent être évalués (sélectionné: {}/{})",
                        plan.getPlanCode(), plan.getSelectedSitesCount(), plan.getTotalSitesInScope());
            }
        }
        // §5.1.b: Full scope must be assessed at initial
        if (plan.getTotalMethodsInScope() != null && plan.getSelectedMethodsCount() != null) {
            if (plan.getSelectedMethodsCount() < plan.getTotalMethodsInScope()) {
                log.warn("Plan {}: évaluation initiale — toute la portée doit être évaluée (sélectionné: {}/{})",
                        plan.getPlanCode(), plan.getSelectedMethodsCount(), plan.getTotalMethodsInScope());
            }
        }
    }

    private void validateSurveillancePlan(SamplingPlan plan, AccreditationRequest request) {
        // §5.2.a: HQ must always be assessed
        if (plan.getHeadquartersIncluded() == null || !plan.getHeadquartersIncluded()) {
            log.warn("Plan {}: surveillance — le siège doit être systématiquement évalué", plan.getPlanCode());
        }
        // PRO 26 §5.7 — pour un OEC multisites, l'échantillonnage en surveillance/renouvellement
        // doit couvrir au moins ⌈√n⌉ sites satellites en portée (n = nombre de sites satellites actifs).
        if (Boolean.TRUE.equals(request.getIsMultisite())) {
            long activeInScope = satelliteSiteRepository.countByRequest_IdAndStatus(
                request.getId(), SatelliteSiteStatus.ACTIVE);
            int minSatellites = (int) Math.ceil(Math.sqrt(activeInScope));
            int requiredTotal = 1 + minSatellites; // +1 pour le siège
            if (plan.getSelectedSitesCount() == null || plan.getSelectedSitesCount() < requiredTotal) {
                throw new RuntimeException(
                    "PRO 26 §5.7 : l'échantillonnage multisites doit couvrir au moins le siège + ⌈√" + activeInScope +
                    "⌉ = " + minSatellites + " sites satellites (total requis : " + requiredTotal +
                    ", sélectionnés : " + plan.getSelectedSitesCount() + ")");
            }
        }
    }

    private SamplingPlan getPlanOrThrow(Long id) {
        return samplingPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan d'échantillonnage non trouvé: " + id));
    }

    // ---- Helper methods ----

    private String getString(Map<String, Object> data, String key, String defaultVal) {
        Object val = data.get(key);
        return val != null ? val.toString() : defaultVal;
    }

    private Integer getInt(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).intValue();
        try { return Integer.parseInt(val.toString()); } catch (NumberFormatException e) { return null; }
    }

    private Boolean getBool(Map<String, Object> data, String key) {
        Object val = data.get(key);
        if (val == null) return null;
        if (val instanceof Boolean) return (Boolean) val;
        return Boolean.parseBoolean(val.toString());
    }
}
