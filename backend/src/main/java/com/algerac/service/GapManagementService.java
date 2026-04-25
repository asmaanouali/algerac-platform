package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GapManagementService {
    
    private final GapRepository gapRepository;
    private final ActionPlanRepository actionPlanRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    
    /**
     * Équipe d'évaluation identifie un écart (FOR 02)
     */
    @Transactional
    public Gap createGap(Long requestId, String gapCode, GapType type, 
                        String description, String requirement, String evidence, User currentUser) {
        List<UserRole> evaluatorRoles = List.of(UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EXPERT);
        if (!evaluatorRoles.contains(currentUser.getRole())) {
            throw new RuntimeException("Seuls les évaluateurs (REE, ET, EQ, EXPERT) peuvent créer des écarts");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        Gap gap = Gap.builder()
                .request(request)
                .gapCode(gapCode)
                .type(type)
                .description(description)
                .requirement(requirement)
                .evidence(evidence)
                .identifiedDate(LocalDateTime.now())
                .status(GapStatus.IDENTIFIED)
                .build();
        
        gap = gapRepository.save(gap);
        
        // Vérifier les règles de requalification
        checkReclassificationRules(gap);
        
        log.info("Écart {} de type {} créé pour {}", gapCode, type, request.getReferenceNumber());
        return gap;
    }
    
    /**
     * Vérifier les règles de requalification des écarts NC en CRITIQUE
     */
    private void checkReclassificationRules(Gap gap) {
        if (gap.getType() == GapType.NON_CRITIQUE) {
            boolean shouldReclassify = false;
            String reclassificationReason = null;
            
            // Règle 1: ≥3 écarts NC sur même exigence
            long countOnSameRequirement = gapRepository.countByRequest_IdAndRequirement(
                    gap.getRequest().getId(), gap.getRequirement());
            
            if (countOnSameRequirement >= 3) {
                shouldReclassify = true;
                reclassificationReason = "Accumulation de ≥3 écarts non critiques sur l'exigence: " + gap.getRequirement();
                gap.setCountOnSameRequirement((int) countOnSameRequirement);
            }
            
            // Règle 2: Écart systématique multi-départements (à définir selon contexte)
            // Cette vérification nécessiterait des données supplémentaires sur les départements
            
            // Règle 3: Écart récurrent d'une évaluation précédente
            // Cette vérification nécessiterait un historique des évaluations
            
            if (shouldReclassify) {
                gap.setType(GapType.CRITIQUE);
                gap.setReclassifiedToCritical(true);
                gap.setReclassificationReason(reclassificationReason);
                gap.setReclassificationDate(LocalDateTime.now());
                gapRepository.save(gap);
                
                log.warn("Écart {} requalifié en CRITIQUE. Raison: {}", gap.getGapCode(), reclassificationReason);
            }
        }
    }
    
    /**
     * Notifier l'OEC de soumettre les plans d'actions (après clôture évaluation)
     */
    @Transactional
    public void requestActionPlans(Long requestId, User currentUser) {
        if (currentUser.getRole() != UserRole.RA && currentUser.getRole() != UserRole.CD) {
            throw new RuntimeException("Seuls RA/CD peuvent demander les plans d'actions");
        }
        
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        List<Gap> gaps = gapRepository.findByRequest_Id(requestId);
        
        if (gaps.isEmpty()) {
            throw new RuntimeException("Aucun écart identifié");
        }
        
        request.setStatus(RequestStatus.AWAITING_ACTION_PLANS);
        request.setCurrentStep("En attente des plans d'actions OEC");
        request.setPendingWith("OEC");
        requestRepository.save(request);
        
        // Notifier l'OEC
        notificationService.notifyOECActionPlansRequired(request, gaps.size());
        
        log.info("Demande de plans d'actions envoyée à l'OEC pour {} ({} écarts)", 
                request.getReferenceNumber(), gaps.size());
    }
    
    /**
     * OEC soumet un plan d'action pour un écart (délai: 10 jours)
     */
    @Transactional
    public ActionPlan submitActionPlan(Long gapId, String correctiveActions, 
                                      String preventiveActions, String responsiblePerson,
                                      LocalDateTime deadline, String supportingDocuments, User currentUser) {
        Gap gap = gapRepository.findById(gapId)
                .orElseThrow(() -> new RuntimeException("Écart non trouvé"));
        
        AccreditationRequest request = gap.getRequest();
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut soumettre un plan d'action");
        }
        
        // Vérifier le délai (10 jours après clôture évaluation)
        LocalDateTime evaluationCloseDate = request.getEvaluationEndDate();
        boolean submittedInTime = evaluationCloseDate == null || 
                LocalDateTime.now().isBefore(evaluationCloseDate.plusDays(10));
        
        if (!submittedInTime) {
            log.warn("Écart {} : plan d'action soumis hors délai de 10 jours", gap.getGapCode());
        }
        
        ActionPlan plan = ActionPlan.builder()
                .gap(gap)
                .correctiveActions(correctiveActions)
                .preventiveActions(preventiveActions)
                .responsiblePerson(responsiblePerson)
                .implementationDeadline(deadline)
                .supportingDocuments(supportingDocuments)
                .submittedByOEC(LocalDateTime.now())
                .submittedInTime(submittedInTime)
                .status(ActionPlanStatus.SUBMITTED)
                .build();
        
        plan = actionPlanRepository.save(plan);
        
        gap.setStatus(GapStatus.PLAN_SUBMITTED);
        gapRepository.save(gap);
        
        // Notifier l'équipe d'évaluation
        notificationService.notifyTeamActionPlanSubmitted(request, gap.getGapCode());
        
        log.info("Plan d'action soumis pour l'écart {} (dans les délais: {})", 
                gap.getGapCode(), submittedInTime);
        return plan;
    }
    
    /**
     * Équipe évalue le plan d'action (délai: 5 jours)
     */
    @Transactional
    public ActionPlan evaluateActionPlan(Long planId, Boolean accepted, String feedback, User currentUser) {
        List<UserRole> evaluatorRoles = List.of(UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EXPERT);
        if (!evaluatorRoles.contains(currentUser.getRole())) {
            throw new RuntimeException("Seuls les membres de l'équipe d'évaluation peuvent évaluer les plans d'actions");
        }
        
        ActionPlan plan = actionPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));
        
        plan.setEvaluatedByTeam(LocalDateTime.now());
        plan.setAcceptedByTeam(accepted);
        plan.setTeamFeedback(feedback);
        
        Gap gap = plan.getGap();
        
        if (accepted) {
            plan.setStatus(ActionPlanStatus.ACCEPTED);
            gap.setStatus(GapStatus.PLAN_ACCEPTED);
            
            // Notifier l'OEC
            notificationService.notifyOECActionPlanAccepted(gap.getRequest(), gap.getGapCode());
        } else {
            plan.setStatus(ActionPlanStatus.REJECTED);
            plan.setRejectionReason(feedback);
            gap.setStatus(GapStatus.PLAN_REJECTED);
            
            // Notifier l'OEC qu'il doit proposer un nouveau plan
            notificationService.notifyOECActionPlanRejected(gap.getRequest(), gap.getGapCode(), feedback);
        }
        
        plan = actionPlanRepository.save(plan);
        gapRepository.save(gap);
        
        log.info("Plan d'action pour écart {} : {}", gap.getGapCode(), 
                accepted ? "ACCEPTÉ" : "REJETÉ");
        return plan;
    }
    
    /**
     * OEC fournit les preuves de mise en œuvre
     */
    @Transactional
    public ActionPlan submitImplementationEvidence(Long planId, String evidence, User currentUser) {
        ActionPlan plan = actionPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));
        
        Gap gap = plan.getGap();
        AccreditationRequest request = gap.getRequest();
        
        if (!request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Seul l'OEC concerné peut soumettre les preuves");
        }
        
        plan.setImplementationEvidence(evidence);
        plan.setImplementationCompletedDate(LocalDateTime.now());
        plan.setStatus(ActionPlanStatus.EVIDENCE_SUBMITTED);
        
        gap.setStatus(GapStatus.EVIDENCE_PROVIDED);
        
        plan = actionPlanRepository.save(plan);
        gapRepository.save(gap);
        
        // Notifier l'équipe
        notificationService.notifyTeamEvidenceSubmitted(request, gap.getGapCode());
        
        log.info("Preuves de mise en œuvre soumises pour écart {}", gap.getGapCode());
        return plan;
    }
    
    /**
     * Équipe vérifie les preuves
     */
    @Transactional
    public ActionPlan verifyEvidence(Long planId, Boolean satisfactory, User currentUser) {
        List<UserRole> evaluatorRoles = List.of(UserRole.REE, UserRole.ET, UserRole.EQ, UserRole.EXPERT);
        if (!evaluatorRoles.contains(currentUser.getRole())) {
            throw new RuntimeException("Seuls les membres de l'équipe d'évaluation peuvent vérifier les preuves");
        }
        
        ActionPlan plan = actionPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan d'action non trouvé"));
        
        plan.setEvidenceSatisfactory(satisfactory);
        
        Gap gap = plan.getGap();
        
        if (satisfactory) {
            plan.setStatus(ActionPlanStatus.VERIFIED);
            
            // Si écart critique, peut nécessiter une évaluation complémentaire
            if (gap.getType() == GapType.CRITIQUE) {
                gap.setStatus(GapStatus.NEEDS_COMPLEMENTARY_EVAL);
                
                // Notifier CD de décider si évaluation complémentaire nécessaire
                notificationService.notifyCDComplementaryEvalDecision(gap.getRequest(), gap.getGapCode());
            } else {
                // Écart non critique: soldé (vérification lors évaluation suivante)
                gap.setStatus(GapStatus.RESOLVED);
                plan.setStatus(ActionPlanStatus.COMPLETED);
            }
        } else {
            // Preuves non satisfaisantes: demander compléments
            gap.setStatus(GapStatus.IMPLEMENTATION);
            
            // Notifier l'OEC
            notificationService.notifyOECEvidenceInsufficient(gap.getRequest(), gap.getGapCode());
        }
        
        plan = actionPlanRepository.save(plan);
        gapRepository.save(gap);
        
        log.info("Preuves pour écart {} : {}", gap.getGapCode(), 
                satisfactory ? "SATISFAISANTES" : "INSUFFISANTES");
        return plan;
    }
    
    /**
     * Vérifier si tous les écarts critiques sont soldés (délai: 6 mois)
     */
    public boolean areAllCriticalGapsResolved(Long requestId) {
        long unresolvedCriticalGaps = gapRepository.countByRequest_IdAndTypeAndStatusNot(
                requestId, GapType.CRITIQUE, GapStatus.RESOLVED);
        
        return unresolvedCriticalGaps == 0;
    }
    
    /**
     * Obtenir tous les écarts d'une demande
     */
    public List<Gap> getRequestGaps(Long requestId) {
        return gapRepository.findByRequest_Id(requestId);
    }
    
    /**
     * Obtenir les écarts par type
     */
    public List<Gap> getRequestGapsByType(Long requestId, GapType type) {
        return gapRepository.findByRequest_IdAndType(requestId, type);
    }
}
