package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.RiskOpportunityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_30 : Service de gestion des risques et opportunités.
 * Workflow : Identification (CD+DT+RQ) → Analyse → Soumission DG → Validation DG → Traitement → Suivi → Clôture
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskOpportunityService {

    private final RiskOpportunityRepository riskRepository;

    /**
     * §5.1 — Identifier un risque/opportunité (brainstorming CD+DT+RQ)
     */
    @Transactional
    public RiskOpportunityRegister identify(RiskType type, String title, String description,
            RiskCategory category, String source, String ownerDepartment, User creator) {

        String prefix = (type == RiskType.RISK ? "RSK" : "OPP");
        String registerCode = prefix + "-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        RiskOpportunityRegister register = RiskOpportunityRegister.builder()
                .registerCode(registerCode)
                .type(type)
                .title(title)
                .description(description)
                .category(category)
                .source(source)
                .owner(creator)
                .ownerDepartment(ownerDepartment)
                .status(RiskRegisterStatus.IDENTIFIED)
                .build();

        register = riskRepository.save(register);
        log.info("PRO30 §5.1 — {} {} identifié par {}: {}", type, registerCode, creator.getFullName(), title);
        return register;
    }

    /**
     * §5.2 — Analyser : renseigner Conséquence et Vraisemblance (CD+DT+RQ)
     * Calcul du niveau via la matrice 3×3.
     */
    @Transactional
    public RiskOpportunityRegister analyze(Long registerId, RiskLikelihood likelihood, RiskImpact impact,
            String residualDocControl, String residualCompetence, String residualControlLevel,
            RiskMastery residualMastery, User analyst) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        if (register.getStatus() != RiskRegisterStatus.IDENTIFIED) {
            throw new RuntimeException("Le risque doit être au statut IDENTIFIED pour être analysé");
        }

        RiskLevel level = calculateRiskLevel(likelihood, impact);

        register.setLikelihood(likelihood);
        register.setImpact(impact);
        register.setLevel(level);
        register.setResidualDocControl(residualDocControl);
        register.setResidualCompetence(residualCompetence);
        register.setResidualControlLevel(residualControlLevel);
        register.setResidualMastery(residualMastery);
        register.setStatus(RiskRegisterStatus.ANALYZED);

        register = riskRepository.save(register);
        log.info("PRO30 §5.2 — {} analysé: niveau={}", register.getRegisterCode(), level);
        return register;
    }

    /**
     * §5.3 — Le RQ soumet FOR 77 à la DG pour vérification
     */
    @Transactional
    public RiskOpportunityRegister submitToDG(Long registerId, User rq) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        if (register.getStatus() != RiskRegisterStatus.ANALYZED) {
            throw new RuntimeException("Le risque doit être analysé avant soumission à la DG");
        }

        register.setSubmittedBy(rq);
        register.setSubmittedAt(LocalDateTime.now());
        register.setStatus(RiskRegisterStatus.PENDING_VALIDATION);

        register = riskRepository.save(register);
        log.info("PRO30 §5.3 — {} soumis à la DG par {}", register.getRegisterCode(), rq.getFullName());
        return register;
    }

    /**
     * §5.4 — La DG vérifie et valide la matrice
     */
    @Transactional
    public RiskOpportunityRegister validateByDG(Long registerId, User dg) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        if (register.getStatus() != RiskRegisterStatus.PENDING_VALIDATION) {
            throw new RuntimeException("Le risque doit être en attente de validation");
        }

        register.setValidatedBy(dg);
        register.setValidatedAt(LocalDateTime.now());
        register.setStatus(RiskRegisterStatus.VALIDATED);

        register = riskRepository.save(register);
        log.info("PRO30 §5.4 — {} validé par la DG {}", register.getRegisterCode(), dg.getFullName());
        return register;
    }

    /**
     * §5.4 — Mettre en traitement (plan d'action défini, RQ assure la mise en œuvre)
     */
    @Transactional
    public RiskOpportunityRegister startTreatment(Long registerId, String mitigationActions,
            String actionPlan, LocalDate actionDeadline) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        if (register.getStatus() != RiskRegisterStatus.VALIDATED) {
            throw new RuntimeException("Le risque doit être validé par la DG avant traitement");
        }

        register.setMitigationActions(mitigationActions);
        register.setActionPlan(actionPlan);
        register.setActionDeadline(actionDeadline);
        register.setStatus(RiskRegisterStatus.IN_TREATMENT);

        register = riskRepository.save(register);
        log.info("PRO30 §5.4 — {} en traitement", register.getRegisterCode());
        return register;
    }

    /**
     * §5.5 — Suivi : RQ+CD+DT évaluent l'efficacité
     */
    @Transactional
    public RiskOpportunityRegister monitor(Long registerId, String reviewNotes,
            String actionProgress, LocalDate nextReview) {
        RiskOpportunityRegister register = getOrThrow(registerId);
        if (register.getStatus() != RiskRegisterStatus.IN_TREATMENT &&
            register.getStatus() != RiskRegisterStatus.MONITORED) {
            throw new RuntimeException("Le risque doit être en traitement ou en suivi");
        }

        register.setReviewNotes(reviewNotes);
        register.setActionProgress(actionProgress);
        register.setLastReviewDate(LocalDate.now());
        register.setNextReviewDate(nextReview != null ? nextReview : LocalDate.now().plusMonths(3));
        register.setStatus(RiskRegisterStatus.MONITORED);

        register = riskRepository.save(register);
        log.info("PRO30 §5.5 — {} suivi effectué", register.getRegisterCode());
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
        log.info("PRO30 — {} clôturé", register.getRegisterCode());
        return register;
    }

    // Queries
    public List<RiskOpportunityRegister> getAll() { return riskRepository.findAllByOrderByCreatedAtDesc(); }
    public List<RiskOpportunityRegister> getByStatus(RiskRegisterStatus status) { return riskRepository.findByStatus(status); }
    public List<RiskOpportunityRegister> getOverdueReviews() {
        return riskRepository.findByNextReviewDateBefore(LocalDate.now());
    }

    /**
     * Matrice de risque 3×3 selon PRO 30 §5.2 :
     *
     *                    Peu Probable(1)  Probable(2)  Presque certain(3)
     * Grave(3)                H              H              H
     * Modéré(2)               M              H              H
     * Insignifiant(1)         L              M              M
     *
     * Score = conséquence × vraisemblance
     * H (6-9) | M (3-4) | L (1-2)
     */
    private RiskLevel calculateRiskLevel(RiskLikelihood likelihood, RiskImpact impact) {
        int l = likelihood.ordinal() + 1; // 1, 2, 3
        int c = impact.ordinal() + 1;     // 1, 2, 3
        int score = l * c;

        if (score >= 6) return RiskLevel.HIGH;
        if (score >= 3) return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }

    private RiskOpportunityRegister getOrThrow(Long id) {
        return riskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registre risque/opportunité non trouvé: " + id));
    }
}
