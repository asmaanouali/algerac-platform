package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.SamplingPlanRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_13-1 : Service de gestion des plans d'échantillonnage
 * pour les évaluations de laboratoires et d'inspection.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SamplingService {

    private final SamplingPlanRepository samplingPlanRepository;
    private final RequestRepository requestRepository;

    /**
     * Créer un plan d'échantillonnage pour une demande
     */
    @Transactional
    public SamplingPlan createSamplingPlan(Long requestId, SamplingPlanType planType,
            String methodology, Integer totalMethods, Integer selectedMethods,
            String selectedMethodsDetail, Integer totalSites, Integer selectedSites,
            String selectedSitesDetail, String selectionCriteria, String riskFactors,
            String justification, User currentUser) {

        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String planCode = "SAMP-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        SamplingPlan plan = SamplingPlan.builder()
                .request(request)
                .planCode(planCode)
                .planType(planType)
                .methodology(methodology)
                .totalMethodsInScope(totalMethods)
                .selectedMethodsCount(selectedMethods)
                .selectedMethods(selectedMethodsDetail)
                .totalSitesInScope(totalSites)
                .selectedSitesCount(selectedSites)
                .selectedSites(selectedSitesDetail)
                .selectionCriteria(selectionCriteria)
                .riskFactors(riskFactors)
                .justification(justification)
                .status(SamplingPlanStatus.DRAFT)
                .createdBy(currentUser)
                .build();

        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} créé pour la demande {}", planCode, request.getReferenceNumber());
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
        plan.setStatus(SamplingPlanStatus.APPLIED);
        plan = samplingPlanRepository.save(plan);
        log.info("Plan d'échantillonnage {} appliqué", plan.getPlanCode());
        return plan;
    }

    public List<SamplingPlan> getPlansByRequest(Long requestId) {
        return samplingPlanRepository.findByRequest_Id(requestId);
    }

    public List<SamplingPlan> getPlansByStatus(SamplingPlanStatus status) {
        return samplingPlanRepository.findByStatus(status);
    }

    private SamplingPlan getPlanOrThrow(Long id) {
        return samplingPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan d'échantillonnage non trouvé: " + id));
    }
}
