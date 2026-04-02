package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de surveillance des délais critiques.
 * Envoie des rappels et effectue les transitions automatiques quand les délais sont dépassés.
 *
 * Délais implémentés :
 * - Correction recevabilité OEC : 30 jours
 * - Validation devis OEC : 15 jours (basé sur sentToOecDate)
 * - Soumission plans d'action OEC : 10 jours après clôture évaluation
 * - Évaluation plans par équipe : 5 jours
 * - Rédaction rapport REE : 30 jours après clôture
 * - Validation rapport CD/DT : 15 jours
 * - Réponse OEC revue documentaire : 3 mois
 * - Réponse OEC composition équipe : 3 jours
 * - Résolution écarts critiques : 6 mois
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineEnforcementService {

    private final RequestRepository requestRepository;
    private final QuotationRepository quotationRepository;
    private final EvaluationTeamRepository teamRepository;
    private final GapRepository gapRepository;
    private final NotificationService notificationService;

    /**
     * Vérification toutes les heures des délais critiques
     */
    @Scheduled(fixedRate = 3600000) // every hour
    @Transactional
    public void checkDeadlines() {
        log.debug("Vérification des délais en cours...");
        checkReceivabilityCorrectionDeadlines();
        checkQuotationExpiry();
        checkTeamOECResponseDeadline();
        checkDocReviewOECResponseDeadline();
        checkActionPlanSubmissionDeadline();
        checkActionPlanEvaluationDeadline();
        checkReportDraftingDeadline();
        checkReportValidationDeadline();
        checkCriticalGapResolutionDeadline();
        sendEarlyWarnings();
        log.debug("Vérification des délais terminée");
    }

    /**
     * Envoie des avertissements précoces avant l'expiration des délais:
     * - 7 jours avant: notification "warning"
     * - 3 jours avant: notification "urgent"
     * Concerne: devis OEC (15j), correction recevabilité (6 mois/30j),
     *           doc review OEC (3 mois), plans d'action (10j)
     */
    private void sendEarlyWarnings() {
        LocalDateTime now = LocalDateTime.now();

        // Devis envoyés à l'OEC: avertir 7j et 3j avant expiration (délai 15j)
        for (Quotation q : quotationRepository.findByStatus(QuotationStatus.SENT_TO_OEC)) {
            if (q.getSentToOecDate() == null) continue;
            long daysLeft = java.time.Duration.between(now, q.getSentToOecDate().plusDays(15)).toDays();
            if (daysLeft == 7 || daysLeft == 3) {
                AccreditationRequest req = q.getRequest();
                if (req != null) {
                    notificationService.createNotification(
                            req.getOec().getId(),
                            daysLeft == 3 ? "⚠ URGENT - Devis expire bientôt" : "Rappel - Devis en attente",
                            "Il vous reste " + daysLeft + " jour(s) pour valider le devis " + q.getQuotationNumber()
                                    + " pour la demande " + req.getReferenceNumber() + ".",
                            daysLeft == 3 ? "warning" : "info"
                    );
                }
            }
        }

        // Correction recevabilité: avertir 7j et 3j avant deadline
        for (AccreditationRequest req : requestRepository.findByStatusIn(
                List.of(RequestStatus.NOT_RECEIVABLE, RequestStatus.RECEIVABILITY_CORRECTION))) {
            if (req.getCorrectionDeadline() == null) continue;
            long daysLeft = java.time.Duration.between(now, req.getCorrectionDeadline()).toDays();
            if (daysLeft == 7 || daysLeft == 3) {
                notificationService.createNotification(
                        req.getOec().getId(),
                        daysLeft == 3 ? "⚠ URGENT - Correction recevabilité" : "Rappel - Correction recevabilité",
                        "Il vous reste " + daysLeft + " jour(s) pour soumettre les corrections pour " + req.getReferenceNumber() + ".",
                        daysLeft == 3 ? "warning" : "info"
                );
            }
        }

        // Action plans: plans d'action (10j après clôture)
        for (AccreditationRequest req : requestRepository.findByStatus(RequestStatus.AWAITING_ACTION_PLANS)) {
            if (req.getEvaluationEndDate() == null) continue;
            long daysLeft = java.time.Duration.between(now, req.getEvaluationEndDate().plusDays(10)).toDays();
            if (daysLeft == 5 || daysLeft == 2) {
                notificationService.createNotification(
                        req.getOec().getId(),
                        daysLeft == 2 ? "⚠ URGENT - Plans d'action" : "Rappel - Plans d'action",
                        "Il vous reste " + daysLeft + " jour(s) pour soumettre les plans d'action pour " + req.getReferenceNumber() + ".",
                        daysLeft == 2 ? "warning" : "info"
                );
            }
        }
    }

    /**
     * Vérifie les demandes avec correction de recevabilité dont le délai est dépassé.
     * PRO 12 §1.2: l'OEC dispose de 6 mois pour compléter son dossier.
     * Cherche à la fois NOT_RECEIVABLE et RECEIVABILITY_CORRECTION.
     */
    private void checkReceivabilityCorrectionDeadlines() {
        List<AccreditationRequest> requests = requestRepository.findByStatusIn(
                List.of(RequestStatus.NOT_RECEIVABLE, RequestStatus.RECEIVABILITY_CORRECTION));
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getCorrectionDeadline() != null && request.getCorrectionDeadline().isBefore(now)) {
                log.warn("Délai de correction dépassé pour la demande {}", request.getReferenceNumber());
                request.setStatus(RequestStatus.CLOSED);
                request.setCurrentStep("Dossier classé - délai de correction expiré");
                request.setPendingWith("NONE");
                requestRepository.save(request);
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Délai de correction expiré",
                        "Le délai de correction pour la demande " + request.getReferenceNumber() + " est dépassé. Le dossier est classé.",
                        "DEADLINE_EXPIRED"
                );
                // Notifier RA et CD
                if (request.getAssignedToRa() != null) {
                    notificationService.createNotification(
                            request.getAssignedToRa().getId(),
                            "Délai de correction expiré",
                            "La demande " + request.getReferenceNumber() + " est classée (correction non soumise dans les 30 jours).",
                            "DEADLINE_EXPIRED"
                    );
                }
            }
        }
    }

    /**
     * Vérifie les devis envoyés à l'OEC dont le délai de validation est dépassé (15 jours)
     */
    private void checkQuotationExpiry() {
        List<Quotation> sentQuotations = quotationRepository.findByStatus(QuotationStatus.SENT_TO_OEC);
        LocalDateTime now = LocalDateTime.now();
        for (Quotation quotation : sentQuotations) {
            if (quotation.getSentToOecDate() != null
                    && quotation.getSentToOecDate().plusDays(15).isBefore(now)) {
                log.warn("Devis expiré: {}", quotation.getQuotationNumber());
                quotation.setStatus(QuotationStatus.EXPIRED);
                quotationRepository.save(quotation);
                AccreditationRequest request = quotation.getRequest();
                if (request != null) {
                    request.setStatus(RequestStatus.QUOTATION_EXPIRED);
                    request.setCurrentStep("Dossier classé - devis expiré");
                    requestRepository.save(request);
                    // Notifier l'OEC
                    notificationService.createNotification(
                            request.getOec().getId(),
                            "Devis expiré",
                            "Le devis pour la demande " + request.getReferenceNumber() + " a expiré (délai 15 jours dépassé). Le dossier est classé.",
                            "DEADLINE_EXPIRED"
                    );
                }
            }
        }
    }

    /**
     * Vérifie les équipes envoyées à l'OEC dont le délai de réponse est dépassé (3 jours)
     */
    private void checkTeamOECResponseDeadline() {
        List<EvaluationTeam> teams = teamRepository.findByStatus(TeamStatus.SENT_TO_OEC);
        LocalDateTime now = LocalDateTime.now();
        for (EvaluationTeam team : teams) {
            if (team.getOecResponseDeadline() != null && team.getOecResponseDeadline().isBefore(now)) {
                log.warn("Délai de réponse OEC dépassé pour l'équipe {}", team.getTeamCode());
                // OEC n'a pas répondu dans les 3 jours → équipe considérée comme validée
                team.setOecValidated(true);
                team.setFinalValidationDate(now);
                team.setStatus(TeamStatus.VALIDATED);
                teamRepository.save(team);
                AccreditationRequest request = team.getRequest();
                if (request != null) {
                    request.setStatus(RequestStatus.TEAM_VALIDATED);
                    request.setCurrentStep("Équipe validée par défaut (pas de réponse OEC dans les 3 jours)");
                    requestRepository.save(request);
                    notificationService.createNotification(
                            request.getOec().getId(),
                            "Équipe validée par défaut",
                            "Votre délai de réponse de 3 jours est dépassé. L'équipe pour " + request.getReferenceNumber() + " est considérée comme acceptée.",
                            "DEADLINE_EXPIRED"
                    );
                }
            }
        }
    }

    /**
     * Vérifie les demandes en attente de réponse OEC pour la revue documentaire (3 mois)
     */
    private void checkDocReviewOECResponseDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.AWAITING_OEC_DOC_RESPONSE);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getNextActionDate() != null && request.getNextActionDate().isBefore(now)) {
                log.warn("Délai de réponse OEC revue documentaire dépassé (3 mois) pour {}", request.getReferenceNumber());
                request.setStatus(RequestStatus.DOC_REVIEW_CD_DECISION);
                request.setCurrentStep("Délai OEC expiré - CD doit décider");
                request.setPendingWith("CD");
                requestRepository.save(request);
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Délai de réponse expiré",
                        "Votre délai de 3 mois pour répondre à la revue documentaire de " + request.getReferenceNumber() + " est dépassé.",
                        "DEADLINE_EXPIRED"
                );
            }
        }
    }

    /**
     * Vérifie les demandes en attente de plans d'action OEC (10 jours après clôture)
     */
    private void checkActionPlanSubmissionDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.AWAITING_ACTION_PLANS);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getEvaluationEndDate() != null
                    && request.getEvaluationEndDate().plusDays(10).isBefore(now)) {
                log.warn("Délai de soumission plans d'action dépassé (10 jours) pour {}", request.getReferenceNumber());
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Rappel urgent - Plans d'action",
                        "Le délai de 10 jours pour soumettre les plans d'action pour " + request.getReferenceNumber() + " est dépassé. Veuillez soumettre immédiatement.",
                        "DEADLINE_EXPIRED"
                );
            }
        }
    }

    /**
     * Vérifie les plans d'action en attente d'évaluation par l'équipe (5 jours)
     */
    private void checkActionPlanEvaluationDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.ACTION_PLANS_EVALUATION);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getNextActionDate() != null && request.getNextActionDate().plusDays(5).isBefore(now)) {
                log.warn("Délai d'évaluation des plans d'action dépassé (5 jours) pour {}", request.getReferenceNumber());
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Rappel - Évaluation plans d'action en retard",
                        "L'équipe n'a pas encore évalué les plans d'action pour " + request.getReferenceNumber() + ".",
                        "DEADLINE_WARNING"
                );
            }
        }
    }

    /**
     * Vérifie les demandes en rédaction de rapport (30 jours après clôture évaluation)
     */
    private void checkReportDraftingDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.REPORT_DRAFTING);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getEvaluationEndDate() != null
                    && request.getEvaluationEndDate().plusDays(30).isBefore(now)) {
                log.warn("Délai de rédaction du rapport dépassé (30 jours) pour {}", request.getReferenceNumber());
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Rapport d'évaluation en retard",
                        "Le rapport d'évaluation pour " + request.getReferenceNumber() + " n'a pas été rédigé dans le délai de 30 jours.",
                        "DEADLINE_EXPIRED"
                );
            }
        }
    }

    /**
     * Vérifie les rapports en validation CD/DT (15 jours)
     */
    private void checkReportValidationDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.REPORT_VALIDATION);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getNextActionDate() != null && request.getNextActionDate().plusDays(15).isBefore(now)) {
                log.warn("Délai de validation du rapport dépassé (15 jours) pour {}", request.getReferenceNumber());
            }
        }
    }

    /**
     * Vérifie les écarts critiques dont le délai de résolution est dépassé (6 mois)
     */
    private void checkCriticalGapResolutionDeadline() {
        List<AccreditationRequest> requests = requestRepository.findByStatusIn(
                List.of(RequestStatus.AWAITING_ACTION_PLANS, RequestStatus.ACTION_PLANS_EVALUATION,
                        RequestStatus.ACTION_PLANS_IMPLEMENTATION));
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getEvaluationEndDate() != null
                    && request.getEvaluationEndDate().plusMonths(6).isBefore(now)) {
                long unresolvedCritical = gapRepository.countByRequest_IdAndTypeAndStatusNot(
                        request.getId(), GapType.CRITIQUE, GapStatus.RESOLVED);
                if (unresolvedCritical > 0) {
                    log.warn("Écarts critiques non résolus après 6 mois pour {} ({} écarts)",
                            request.getReferenceNumber(), unresolvedCritical);
                    notificationService.createNotification(
                            request.getOec().getId(),
                            "Écarts critiques - délai 6 mois dépassé",
                            unresolvedCritical + " écart(s) critique(s) non résolu(s) pour " + request.getReferenceNumber() + " après 6 mois.",
                            "DEADLINE_EXPIRED"
                    );
                }
            }
        }
    }
}
