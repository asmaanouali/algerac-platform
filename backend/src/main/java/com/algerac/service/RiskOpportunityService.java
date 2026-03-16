package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.RiskOpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_30 : Service de gestion des risques et opportunités.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskOpportunityService {

    private final RiskOpportunityRepository riskRepository;

    /**
     * Identifier un nouveau risque ou opportunité
     */
    @Transactional
    public RiskOpportunityRegister identifyRisk(RiskType type, String title, String description,
            RiskCategory category, String source, RiskLikelihood likelihood, RiskImpact impact,
            String ownerDepartment, User owner) {

        String registerCode = (type == RiskType.RISK ? "RSK" : "OPP") + "-" +
                Year.now().getValue() + "-" + String.format("%04d", new Random().nextInt(9999));

        RiskLevel level = calculateRiskLevel(likelihood, impact);

        RiskOpportunityRegister register = RiskOpportunityRegister.builder()
                .registerCode(registerCode)
                .type(type)
                .title(title)
                .description(description)
                .category(category)
                .source(source)
                .likelihood(likelihood)
                .impact(impact)
                .level(level)
                .owner(owner)
                .ownerDepartment(ownerDepartment)
                .status(RiskRegisterStatus.IDENTIFIED)
                .nextReviewDate(LocalDate.now().plusMonths(3)) // Review every 3 months
                .build();

        register = riskRepository.save(register);
        log.info("{} {} identifié: {}", type, registerCode, title);
        return register;
    }

    /**
     * Définir le plan de traitement
     */
    @Transactional
    public RiskOpportunityRegister defineTreatmentPlan(Long registerId, String mitigationActions,
            String actionPlan, LocalDate actionDeadline, String keyIndicators) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        register.setMitigationActions(mitigationActions);
        register.setActionPlan(actionPlan);
        register.setActionDeadline(actionDeadline);
        register.setKeyIndicators(keyIndicators);
        register.setStatus(RiskRegisterStatus.TREATMENT_PLAN);
        register = riskRepository.save(register);
        log.info("Plan de traitement défini pour {}", register.getRegisterCode());
        return register;
    }

    /**
     * Démarrer le traitement
     */
    @Transactional
    public RiskOpportunityRegister startTreatment(Long registerId) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        register.setStatus(RiskRegisterStatus.IN_TREATMENT);
        register = riskRepository.save(register);
        return register;
    }

    /**
     * Mettre à jour les progrès
     */
    @Transactional
    public RiskOpportunityRegister updateProgress(Long registerId, String progressNotes) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        register.setActionProgress(progressNotes);
        register = riskRepository.save(register);
        return register;
    }

    /**
     * Effectuer une revue périodique
     */
    @Transactional
    public RiskOpportunityRegister performReview(Long registerId, RiskLikelihood newLikelihood,
            RiskImpact newImpact, String reviewNotes, LocalDate nextReview) {
        RiskOpportunityRegister register = getOrThrow(registerId);

        if (newLikelihood != null) register.setLikelihood(newLikelihood);
        if (newImpact != null) register.setImpact(newImpact);
        if (newLikelihood != null && newImpact != null) {
            register.setLevel(calculateRiskLevel(newLikelihood, newImpact));
        }

        register.setReviewNotes(reviewNotes);
        register.setLastReviewDate(LocalDate.now());
        register.setNextReviewDate(nextReview != null ? nextReview : LocalDate.now().plusMonths(3));
        register.setStatus(RiskRegisterStatus.MONITORED);
        register = riskRepository.save(register);
        log.info("Revue effectuée pour {}", register.getRegisterCode());
        return register;
    }

    /**
     * Clôturer un risque/opportunité
     */
    @Transactional
    public RiskOpportunityRegister close(Long registerId, String residualNotes) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        register.setStatus(RiskRegisterStatus.CLOSED);
        register.setResidualRiskNotes(residualNotes);
        register = riskRepository.save(register);
        log.info("{} {} clôturé", register.getType(), register.getRegisterCode());
        return register;
    }

    // Queries
    public List<RiskOpportunityRegister> getAll() { return riskRepository.findAllByOrderByCreatedAtDesc(); }
    public List<RiskOpportunityRegister> getRisks() { return riskRepository.findByType(RiskType.RISK); }
    public List<RiskOpportunityRegister> getOpportunities() { return riskRepository.findByType(RiskType.OPPORTUNITY); }
    public List<RiskOpportunityRegister> getByLevel(RiskLevel level) { return riskRepository.findByLevel(level); }
    public List<RiskOpportunityRegister> getOverdueReviews() {
        return riskRepository.findByNextReviewDateBefore(LocalDate.now());
    }

    /**
     * Matrice de calcul du niveau de risque
     */
    private RiskLevel calculateRiskLevel(RiskLikelihood likelihood, RiskImpact impact) {
        int l = likelihood.ordinal(); // 0-4
        int i = impact.ordinal();     // 0-4
        int score = l + i;

        if (score >= 7) return RiskLevel.CRITICAL;
        if (score >= 5) return RiskLevel.HIGH;
        if (score >= 3) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private RiskOpportunityRegister getOrThrow(Long id) {
        return riskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registre risque/opportunité non trouvé: " + id));
    }
}
