package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.ReferenceRuleRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

/**
 * PRO_19 : Service de gestion des règles de référence pour l'accréditation.
 * Gère les normes, transitions normatives, et notification aux OEC.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReferenceRuleService {

    private final ReferenceRuleRepository ruleRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Créer une nouvelle règle de référence
     */
    @Transactional
    public ReferenceRule createRule(String standardCode, String version, String title,
            String description, String applicableDomains, String applicableOecTypes,
            LocalDate publicationDate, LocalDate effectiveDate,
            LocalDate transitionStart, LocalDate transitionEnd,
            String previousCode, String previousVersion,
            String transitionRequirements, String guidanceDocs) {

        String ruleCode = "REF-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        ReferenceRule rule = ReferenceRule.builder()
                .ruleCode(ruleCode)
                .standardCode(standardCode)
                .standardVersion(version)
                .standardTitle(title)
                .description(description)
                .applicableDomains(applicableDomains)
                .applicableOecTypes(applicableOecTypes)
                .publicationDate(publicationDate)
                .effectiveDate(effectiveDate)
                .transitionStartDate(transitionStart)
                .transitionEndDate(transitionEnd)
                .previousStandardCode(previousCode)
                .previousStandardVersion(previousVersion)
                .transitionRequirements(transitionRequirements)
                .guidanceDocuments(guidanceDocs)
                .status(ReferenceRuleStatus.DRAFT)
                .build();

        rule = ruleRepository.save(rule);
        log.info("Règle de référence {} créée: {} {}", ruleCode, standardCode, version);
        return rule;
    }

    /**
     * Publier une règle et notifier les OEC concernés
     */
    @Transactional
    public ReferenceRule publishRule(Long ruleId) {
        ReferenceRule rule = getRuleOrThrow(ruleId);
        rule.setStatus(ReferenceRuleStatus.PUBLISHED);
        rule = ruleRepository.save(rule);

        // Notifier tous les OEC
        List<User> oecUsers = userRepository.findByRole(UserRole.OEC);
        rule.setAffectedOecCount(oecUsers.size());
        rule.setTransitionCompletedCount(0);
        ruleRepository.save(rule);

        for (User oec : oecUsers) {
            notificationService.createNotification(
                    oec.getId(),
                    "Nouvelle norme de référence publiée",
                    String.format("La norme %s %s (%s) a été publiée. Transition requise avant le %s.",
                            rule.getStandardCode(), rule.getStandardVersion(),
                            rule.getStandardTitle(),
                            rule.getTransitionEndDate() != null ? rule.getTransitionEndDate().toString() : "N/A"),
                    "warning"
            );
        }

        log.info("Règle {} publiée, {} OEC notifiés", rule.getRuleCode(), oecUsers.size());
        return rule;
    }

    /**
     * Démarrer la période de transition
     */
    @Transactional
    public ReferenceRule startTransition(Long ruleId) {
        ReferenceRule rule = getRuleOrThrow(ruleId);
        rule.setStatus(ReferenceRuleStatus.IN_TRANSITION);
        rule = ruleRepository.save(rule);
        log.info("Transition démarrée pour la règle {}", rule.getRuleCode());
        return rule;
    }

    /**
     * Enregistrer qu'un OEC a complété la transition
     */
    @Transactional
    public ReferenceRule recordOecTransitionComplete(Long ruleId) {
        ReferenceRule rule = getRuleOrThrow(ruleId);
        int completed = (rule.getTransitionCompletedCount() != null ? rule.getTransitionCompletedCount() : 0) + 1;
        rule.setTransitionCompletedCount(completed);

        // Vérifier si tous les OEC ont complété la transition
        if (rule.getAffectedOecCount() != null && completed >= rule.getAffectedOecCount()) {
            rule.setStatus(ReferenceRuleStatus.ACTIVE);
            log.info("Tous les OEC ont complété la transition pour {}", rule.getRuleCode());
        }

        return ruleRepository.save(rule);
    }

    /**
     * Retirer une norme
     */
    @Transactional
    public ReferenceRule withdrawRule(Long ruleId) {
        ReferenceRule rule = getRuleOrThrow(ruleId);
        rule.setStatus(ReferenceRuleStatus.WITHDRAWN);
        rule.setWithdrawalDate(LocalDate.now());
        rule = ruleRepository.save(rule);
        log.info("Règle {} retirée", rule.getRuleCode());
        return rule;
    }

    public List<ReferenceRule> getAllRules() {
        return ruleRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<ReferenceRule> getActiveRules() {
        return ruleRepository.findByStatusIn(Arrays.asList(
                ReferenceRuleStatus.PUBLISHED, ReferenceRuleStatus.IN_TRANSITION, ReferenceRuleStatus.ACTIVE));
    }

    private ReferenceRule getRuleOrThrow(Long id) {
        return ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Règle de référence non trouvée: " + id));
    }
}
