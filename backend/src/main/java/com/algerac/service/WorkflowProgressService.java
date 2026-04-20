package com.algerac.service;

import com.algerac.model.RequestStatus;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Maps each RequestStatus to a progress percentage and phase label
 * aligned with the PRO 12 procedure phases.
 */
@Service
public class WorkflowProgressService {

    public record WorkflowState(int progress, String phase, String phaseLabel, String stepLabel) {}

    private static final Map<RequestStatus, WorkflowState> STATUS_MAP = Map.ofEntries(
            // Phase initiale (0-10%)
            Map.entry(RequestStatus.DRAFT, new WorkflowState(0, "INITIAL", "Phase Initiale", "Brouillon")),
            Map.entry(RequestStatus.SUBMITTED, new WorkflowState(2, "INITIAL", "Phase Initiale", "Soumise")),
            Map.entry(RequestStatus.PENDING_DT_REVIEW, new WorkflowState(3, "INITIAL", "Phase Initiale", "Vérification DT en cours")),
            Map.entry(RequestStatus.DT_APPROVED, new WorkflowState(5, "INITIAL", "Phase Initiale", "Validée par DT")),
            Map.entry(RequestStatus.DT_REJECTED, new WorkflowState(3, "INITIAL", "Phase Initiale", "Rejetée par DT - correction requise")),
            Map.entry(RequestStatus.PENDING_CD_ASSIGNMENT, new WorkflowState(6, "INITIAL", "Phase Initiale", "En attente d'assignation CD")),
            Map.entry(RequestStatus.AWAITING_REGISTRATION_FEE, new WorkflowState(7, "INITIAL", "Phase Initiale", "En attente frais d'inscription")),
            Map.entry(RequestStatus.PENDING_PAYMENT, new WorkflowState(7, "INITIAL", "Phase Initiale", "Paiement en cours")),
            Map.entry(RequestStatus.PAYMENT_PROOF_SUBMITTED, new WorkflowState(8, "INITIAL", "Phase Initiale", "Preuve de paiement soumise")),
            Map.entry(RequestStatus.PAYMENT_COMPLETED, new WorkflowState(8, "INITIAL", "Phase Initiale", "Paiement validé")),
            Map.entry(RequestStatus.ASSIGNED_TO_RA, new WorkflowState(9, "INITIAL", "Phase Initiale", "Assignée au RA")),

            // Phase I - Recevabilité (10-20%)
            Map.entry(RequestStatus.RECEIVABILITY_STUDY, new WorkflowState(10, "RECEVABILITE", "Phase I - Recevabilité", "Étude de recevabilité")),
            Map.entry(RequestStatus.RECEIVABILITY_PENDING_CD_REVIEW, new WorkflowState(13, "RECEVABILITE", "Phase I - Recevabilité", "Revue CD en cours")),
            Map.entry(RequestStatus.RECEIVABLE, new WorkflowState(15, "RECEVABILITE", "Phase I - Recevabilité", "Recevable")),
            Map.entry(RequestStatus.NOT_RECEIVABLE, new WorkflowState(12, "RECEVABILITE", "Phase I - Recevabilité", "Non recevable")),
            Map.entry(RequestStatus.RECEIVABILITY_CORRECTION, new WorkflowState(11, "RECEVABILITE", "Phase I - Recevabilité", "Correction en cours")),
            Map.entry(RequestStatus.RECEIVABILITY_RESUBMITTED, new WorkflowState(14, "RECEVABILITE", "Phase I - Recevabilité", "Corrections re-soumises")),

            // Visite préliminaire (15-20%)
            Map.entry(RequestStatus.PRELIMINARY_VISIT_PROPOSED, new WorkflowState(16, "VISITE_PREALABLE", "Visite Préliminaire", "Visite proposée")),
            Map.entry(RequestStatus.PRELIMINARY_VISIT_ACCEPTED, new WorkflowState(17, "VISITE_PREALABLE", "Visite Préliminaire", "Visite acceptée")),
            Map.entry(RequestStatus.PRELIMINARY_VISIT_DECLINED, new WorkflowState(16, "VISITE_PREALABLE", "Visite Préliminaire", "Visite déclinée")),
            Map.entry(RequestStatus.PRELIMINARY_VISIT_SCHEDULED, new WorkflowState(17, "VISITE_PREALABLE", "Visite Préliminaire", "Visite planifiée")),
            Map.entry(RequestStatus.PRELIMINARY_VISIT_COMPLETED, new WorkflowState(19, "VISITE_PREALABLE", "Visite Préliminaire", "Visite effectuée")),
            Map.entry(RequestStatus.PRELIMINARY_VISIT_REPORT_PENDING, new WorkflowState(19, "VISITE_PREALABLE", "Visite Préliminaire", "Rapport en attente")),
            Map.entry(RequestStatus.PROCESS_SUSPENDED_OBSTACLES, new WorkflowState(18, "VISITE_PREALABLE", "Visite Préliminaire", "Processus suspendu")),

            // Phase II - Contractualisation (20-35%)
            Map.entry(RequestStatus.QUOTATION_PREPARATION, new WorkflowState(20, "CONTRACTUALISATION", "Phase II - Contractualisation", "Préparation du devis")),
            Map.entry(RequestStatus.QUOTATION_SENT_TO_DAG, new WorkflowState(22, "CONTRACTUALISATION", "Phase II - Contractualisation", "Devis envoyé au DAG")),
            Map.entry(RequestStatus.QUOTATION_APPROVED_BY_DAG, new WorkflowState(24, "CONTRACTUALISATION", "Phase II - Contractualisation", "Devis approuvé par DAG")),
            Map.entry(RequestStatus.CONVENTION_PREPARATION, new WorkflowState(25, "CONTRACTUALISATION", "Phase II - Contractualisation", "Préparation convention")),
            Map.entry(RequestStatus.QUOTATION_CONVENTION_PENDING_CD, new WorkflowState(26, "CONTRACTUALISATION", "Phase II - Contractualisation", "En attente validation CD")),
            Map.entry(RequestStatus.QUOTATION_CONVENTION_CD_MODIF, new WorkflowState(25, "CONTRACTUALISATION", "Phase II - Contractualisation", "Modifications CD")),
            Map.entry(RequestStatus.QUOTATION_SENT_TO_OEC, new WorkflowState(27, "CONTRACTUALISATION", "Phase II - Contractualisation", "Devis envoyé à l'OEC")),
            Map.entry(RequestStatus.QUOTATION_OEC_REMINDER, new WorkflowState(28, "CONTRACTUALISATION", "Phase II - Contractualisation", "Relance OEC")),
            Map.entry(RequestStatus.QUOTATION_VALIDATED, new WorkflowState(30, "CONTRACTUALISATION", "Phase II - Contractualisation", "Devis validé")),
            Map.entry(RequestStatus.CONVENTION_VALIDATED, new WorkflowState(32, "CONTRACTUALISATION", "Phase II - Contractualisation", "Convention validée")),
            Map.entry(RequestStatus.QUOTATION_EXPIRED, new WorkflowState(20, "CONTRACTUALISATION", "Phase II - Contractualisation", "Devis expiré")),

            // Constitution équipe (35-45%)
            Map.entry(RequestStatus.TEAM_DESIGNATION, new WorkflowState(35, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Désignation de l'équipe")),
            Map.entry(RequestStatus.TEAM_SENT_TO_CD, new WorkflowState(37, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Envoyée au CD")),
            Map.entry(RequestStatus.TEAM_CD_APPROVED, new WorkflowState(38, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Approuvée par CD")),
            Map.entry(RequestStatus.TEAM_CD_CHANGES_REQUESTED, new WorkflowState(36, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Changements demandés par CD")),
            Map.entry(RequestStatus.TEAM_SENT_TO_OEC, new WorkflowState(39, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Envoyée à l'OEC")),
            Map.entry(RequestStatus.TEAM_DATE_REFUSED, new WorkflowState(38, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Date refusée par OEC")),
            Map.entry(RequestStatus.TEAM_MEMBER_RECUSED, new WorkflowState(37, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Membre récusé")),
            Map.entry(RequestStatus.TEAM_RECUSED, new WorkflowState(37, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Récusation")),
            Map.entry(RequestStatus.TEAM_RECUSATION_INVALID, new WorkflowState(39, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Récusation invalidée")),
            Map.entry(RequestStatus.TEAM_VALIDATED, new WorkflowState(42, "CONSTITUTION_EQUIPE", "Constitution Équipe", "Équipe validée")),

            // Revue documentaire (45-55%)
            Map.entry(RequestStatus.DOC_REVIEW_AWAITING_FEE, new WorkflowState(43, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "En attente des frais")),
            Map.entry(RequestStatus.DOC_REVIEW_FEE_PENDING_PAYMENT, new WorkflowState(44, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Paiement en cours")),
            Map.entry(RequestStatus.DOC_REVIEW_PAYMENT_SUBMITTED, new WorkflowState(44, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Paiement soumis")),
            Map.entry(RequestStatus.DOC_REVIEW_PAYMENT_VALIDATED, new WorkflowState(45, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Paiement validé")),
            Map.entry(RequestStatus.DOC_REVIEW_IN_PROGRESS, new WorkflowState(47, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Revue en cours")),
            Map.entry(RequestStatus.DOC_REVIEW_RESULTS_SUBMITTED, new WorkflowState(49, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Résultats soumis")),
            Map.entry(RequestStatus.DOC_REVIEW_RESULTS_SENT_TO_CD, new WorkflowState(50, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Résultats envoyés au CD")),
            Map.entry(RequestStatus.DOC_REVIEW_RESULTS_SENT_TO_OEC, new WorkflowState(51, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Résultats envoyés à l'OEC")),
            Map.entry(RequestStatus.AWAITING_OEC_DOC_RESPONSE, new WorkflowState(52, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Attente réponse OEC")),
            Map.entry(RequestStatus.DOC_REVIEW_CD_DECISION, new WorkflowState(53, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Décision CD")),
            Map.entry(RequestStatus.DOCUMENTARY_REVIEW_COMPLETED, new WorkflowState(55, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Revue terminée")),
            Map.entry(RequestStatus.DOCUMENTARY_REVIEW, new WorkflowState(47, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Revue documentaire")),
            Map.entry(RequestStatus.DOCUMENTARY_REVIEW_DEFICIENCIES, new WorkflowState(50, "REVUE_DOCUMENTAIRE", "Revue Documentaire", "Manquements identifiés")),

            // Préparation évaluation (55-65%)
            Map.entry(RequestStatus.MANDATES_PREPARATION, new WorkflowState(55, "PREPARATION_EVALUATION", "Préparation Évaluation", "Préparation mandatements")),
            Map.entry(RequestStatus.MANDATES_PENDING_CD, new WorkflowState(56, "PREPARATION_EVALUATION", "Préparation Évaluation", "Mandatements en attente CD")),
            Map.entry(RequestStatus.MANDATES_CD_MODIFICATION, new WorkflowState(55, "PREPARATION_EVALUATION", "Préparation Évaluation", "Modifications demandées par CD")),
            Map.entry(RequestStatus.MANDATES_SENT_TO_TEAM, new WorkflowState(57, "PREPARATION_EVALUATION", "Préparation Évaluation", "Mandatements envoyés")),
            Map.entry(RequestStatus.MISSION_ORDERS_PENDING, new WorkflowState(58, "PREPARATION_EVALUATION", "Préparation Évaluation", "Ordres de mission en cours")),
            Map.entry(RequestStatus.MISSION_ORDERS_PENDING_DT, new WorkflowState(59, "PREPARATION_EVALUATION", "Préparation Évaluation", "Approbation DT en attente")),
            Map.entry(RequestStatus.MISSION_ORDERS_PENDING_DG, new WorkflowState(60, "PREPARATION_EVALUATION", "Préparation Évaluation", "Approbation DG en attente")),
            Map.entry(RequestStatus.MISSION_ORDERS_SENT, new WorkflowState(61, "PREPARATION_EVALUATION", "Préparation Évaluation", "Ordres de mission envoyés")),
            Map.entry(RequestStatus.EVALUATION_PLAN_PREPARATION, new WorkflowState(62, "PREPARATION_EVALUATION", "Préparation Évaluation", "Plan d'évaluation en préparation")),
            Map.entry(RequestStatus.EVALUATION_PLAN_PENDING_RA, new WorkflowState(62, "PREPARATION_EVALUATION", "Préparation Évaluation", "Plan en attente RA")),
            Map.entry(RequestStatus.EVALUATION_PLAN_RA_APPROVED, new WorkflowState(63, "PREPARATION_EVALUATION", "Préparation Évaluation", "Plan approuvé par RA")),
            Map.entry(RequestStatus.EVALUATION_PLAN_PENDING_CD, new WorkflowState(63, "PREPARATION_EVALUATION", "Préparation Évaluation", "Plan en attente CD")),
            Map.entry(RequestStatus.EVALUATION_PLAN_VALIDATION, new WorkflowState(64, "PREPARATION_EVALUATION", "Préparation Évaluation", "Validation plan")),
            Map.entry(RequestStatus.EVALUATION_PLANNED, new WorkflowState(65, "PREPARATION_EVALUATION", "Préparation Évaluation", "Évaluation planifiée")),

            // Évaluation sur site (65-75%)
            Map.entry(RequestStatus.EVALUATION_IN_PROGRESS, new WorkflowState(66, "EVALUATION", "Phase III - Évaluation", "Évaluation en cours")),
            Map.entry(RequestStatus.EVALUATION_OPENING_MEETING, new WorkflowState(66, "EVALUATION", "Phase III - Évaluation", "Réunion d'ouverture")),
            Map.entry(RequestStatus.EVALUATION_ONGOING, new WorkflowState(68, "EVALUATION", "Phase III - Évaluation", "Évaluation en cours")),
            Map.entry(RequestStatus.EVALUATION_CONSENSUS, new WorkflowState(70, "EVALUATION", "Phase III - Évaluation", "Consensus de l'équipe")),
            Map.entry(RequestStatus.EVALUATION_CLOSING_MEETING, new WorkflowState(72, "EVALUATION", "Phase III - Évaluation", "Réunion de clôture")),
            Map.entry(RequestStatus.EVALUATION_GAPS_SENT_TO_OEC, new WorkflowState(73, "EVALUATION", "Phase III - Évaluation", "Écarts envoyés à l'OEC")),
            Map.entry(RequestStatus.EVALUATION_OEC_REVIEW, new WorkflowState(73, "EVALUATION", "Phase III - Évaluation", "Revue OEC des écarts")),
            Map.entry(RequestStatus.EVALUATION_OEC_ALL_ACCEPTED, new WorkflowState(74, "EVALUATION", "Phase III - Évaluation", "Écarts acceptés par OEC")),
            Map.entry(RequestStatus.EVALUATION_DOCS_TRANSMITTED, new WorkflowState(74, "EVALUATION", "Phase III - Évaluation", "Documents transmis")),
            Map.entry(RequestStatus.EVALUATION_COMPLETED, new WorkflowState(75, "EVALUATION", "Phase III - Évaluation", "Évaluation terminée")),

            // Traitement des écarts (75-82%)
            Map.entry(RequestStatus.AWAITING_ACTION_PLANS, new WorkflowState(76, "TRAITEMENT_ECARTS", "Traitement Écarts", "En attente plans d'action")),
            Map.entry(RequestStatus.ACTION_PLANS_EVALUATION, new WorkflowState(78, "TRAITEMENT_ECARTS", "Traitement Écarts", "Évaluation plans d'action")),
            Map.entry(RequestStatus.ACTION_PLANS_IMPLEMENTATION, new WorkflowState(79, "TRAITEMENT_ECARTS", "Traitement Écarts", "Mise en œuvre")),
            Map.entry(RequestStatus.COMPLEMENTARY_EVALUATION_NEEDED, new WorkflowState(77, "TRAITEMENT_ECARTS", "Traitement Écarts", "Évaluation complémentaire nécessaire")),
            Map.entry(RequestStatus.COMPLEMENTARY_EVALUATION_PLANNED, new WorkflowState(78, "TRAITEMENT_ECARTS", "Traitement Écarts", "Éval. complémentaire planifiée")),
            Map.entry(RequestStatus.COMPLEMENTARY_EVALUATION_PROGRESS, new WorkflowState(79, "TRAITEMENT_ECARTS", "Traitement Écarts", "Éval. complémentaire en cours")),
            Map.entry(RequestStatus.GAPS_RESOLVED, new WorkflowState(82, "TRAITEMENT_ECARTS", "Traitement Écarts", "Écarts résolus")),

            // Rapport (82-87%)
            Map.entry(RequestStatus.REPORT_DRAFTING, new WorkflowState(83, "RAPPORT", "Rapport d'Évaluation", "Rédaction du rapport")),
            Map.entry(RequestStatus.REPORT_VALIDATION, new WorkflowState(85, "RAPPORT", "Rapport d'Évaluation", "Validation du rapport")),
            Map.entry(RequestStatus.REPORT_VALIDATED, new WorkflowState(87, "RAPPORT", "Rapport d'Évaluation", "Rapport validé")),

            // Phase IV - Décision CAS (87-95%)
            Map.entry(RequestStatus.CAS_PREPARATION, new WorkflowState(88, "DECISION_CAS", "Phase IV - Décision CAS", "Préparation CAS")),
            Map.entry(RequestStatus.CAS_SCHEDULED, new WorkflowState(89, "DECISION_CAS", "Phase IV - Décision CAS", "CAS programmé")),
            Map.entry(RequestStatus.CAS_DECISION_GRANT, new WorkflowState(92, "DECISION_CAS", "Phase IV - Décision CAS", "Accréditation accordée")),
            Map.entry(RequestStatus.CAS_DECISION_REFUSAL, new WorkflowState(90, "DECISION_CAS", "Phase IV - Décision CAS", "Accréditation refusée")),
            Map.entry(RequestStatus.CAS_DECISION_POSTPONEMENT, new WorkflowState(89, "DECISION_CAS", "Phase IV - Décision CAS", "Ajournement")),

            // Post-décision (95-100%)
            Map.entry(RequestStatus.CERTIFICATE_PREPARATION, new WorkflowState(95, "POST_DECISION", "Post-Décision", "Préparation certificat")),
            Map.entry(RequestStatus.CERTIFICATE_ISSUED, new WorkflowState(98, "POST_DECISION", "Post-Décision", "Certificat délivré")),
            Map.entry(RequestStatus.ACTIVE, new WorkflowState(100, "ACTIVE", "Accrédité", "Accréditation active")),

            // Statuts finaux
            Map.entry(RequestStatus.SUSPENDED, new WorkflowState(100, "FINALE", "Suspendu", "Accréditation suspendue")),
            Map.entry(RequestStatus.WITHDRAWN, new WorkflowState(100, "FINALE", "Retiré", "Accréditation retirée")),
            Map.entry(RequestStatus.CLOSED, new WorkflowState(0, "FINALE", "Clôturé", "Dossier classé")),

            // Surveillance
            Map.entry(RequestStatus.SURVEILLANCE_SCHEDULED, new WorkflowState(100, "SURVEILLANCE", "Surveillance", "Surveillance planifiée")),
            Map.entry(RequestStatus.SURVEILLANCE_IN_PROGRESS, new WorkflowState(100, "SURVEILLANCE", "Surveillance", "Surveillance en cours")),
            Map.entry(RequestStatus.SURVEILLANCE_COMPLETED, new WorkflowState(100, "SURVEILLANCE", "Surveillance", "Surveillance terminée")),

            // Renouvellement
            Map.entry(RequestStatus.RENEWAL_INITIATED, new WorkflowState(90, "RENOUVELLEMENT", "Renouvellement", "Renouvellement initié")),
            Map.entry(RequestStatus.RENEWAL_EVALUATION, new WorkflowState(93, "RENOUVELLEMENT", "Renouvellement", "Évaluation renouvellement")),
            Map.entry(RequestStatus.RENEWAL_COMPLETED, new WorkflowState(100, "RENOUVELLEMENT", "Renouvellement", "Renouvellement terminé")),

            // Extension
            Map.entry(RequestStatus.EXTENSION_REQUESTED, new WorkflowState(90, "EXTENSION", "Extension", "Extension demandée")),
            Map.entry(RequestStatus.EXTENSION_EVALUATION, new WorkflowState(93, "EXTENSION", "Extension", "Évaluation extension")),
            Map.entry(RequestStatus.EXTENSION_GRANTED, new WorkflowState(100, "EXTENSION", "Extension", "Extension accordée")),

            // Transfert
            Map.entry(RequestStatus.TRANSFER_INITIATED, new WorkflowState(90, "TRANSFERT", "Transfert", "Transfert initié")),
            Map.entry(RequestStatus.TRANSFER_REVIEW, new WorkflowState(93, "TRANSFERT", "Transfert", "Revue transfert")),
            Map.entry(RequestStatus.TRANSFER_COMPLETED, new WorkflowState(100, "TRANSFERT", "Transfert", "Transfert terminé"))
    );

    /**
     * Get the workflow state for a given request status.
     */
    public WorkflowState getWorkflowState(RequestStatus status) {
        return STATUS_MAP.getOrDefault(status,
                new WorkflowState(0, "UNKNOWN", "Inconnu", status.name()));
    }

    /**
     * Get progress percentage for a status.
     */
    public int getProgress(RequestStatus status) {
        return getWorkflowState(status).progress();
    }

    /**
     * Get the phase identifier for a status.
     */
    public String getPhase(RequestStatus status) {
        return getWorkflowState(status).phase();
    }

    /**
     * Get the human-readable phase label for a status.
     */
    public String getPhaseLabel(RequestStatus status) {
        return getWorkflowState(status).phaseLabel();
    }

    /**
     * Get the human-readable step label for a status.
     */
    public String getStepLabel(RequestStatus status) {
        return getWorkflowState(status).stepLabel();
    }
}
