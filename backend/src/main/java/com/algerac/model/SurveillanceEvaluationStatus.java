package com.algerac.model;

public enum SurveillanceEvaluationStatus {
    PLANNED,                    // Programmée (plan de surveillance)
    RISK_ANALYSIS_SENT,         // FOR 77-1 envoyé à l'OEC
    RISK_ANALYSIS_COMPLETED,    // FOR 77-1 complété par l'OEC
    RISK_ANALYZED,              // FOR 77-1 analysé par RA
    DOCUMENTS_REQUESTED,        // FOR 68 envoyé (1 mois avant)
    DOCUMENTS_RECEIVED,         // Documents reçus de l'OEC
    QUOTATION_SENT,             // Devis envoyé
    QUOTATION_ACCEPTED,         // Devis validé et réglé par OEC
    TEAM_DESIGNATED,            // Équipe désignée
    TEAM_VALIDATED,             // Équipe validée par OEC
    PLAN_PREPARED,              // Plan d'évaluation préparé
    PLAN_VALIDATED,             // Plan validé par CD
    PLAN_SENT_TO_OEC,           // Plan envoyé à l'OEC (min 5j avant)
    MISSION_ORDERS_APPROVED,    // Ordres de mission approuvés DT/DG
    MISSION_ORDERS_SENT,        // Ordres de mission envoyés
    IN_PROGRESS,                // Évaluation en cours (jour J)
    EVALUATION_COMPLETED,       // Évaluation terminée
    REPORT_DRAFTING,            // Rédaction rapport (30j)
    REPORT_VALIDATION,          // Validation rapport (15j)
    REPORT_VALIDATED,           // Rapport validé
    CAS_PREPARATION,            // Préparation dossier CAS
    CAS_SUBMITTED,              // Soumis au CAS
    COMPLETED,                  // Terminée
    SANCTIONS_APPLIED           // Sanctions appliquées (PRO 23)
}
