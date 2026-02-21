package com.algerac.model;

public enum ComplementaryEvaluationStatus {
    DECIDED,                // CD a décidé l'évaluation complémentaire
    QUOTATION_PREPARED,     // Devis établi par RA
    QUOTATION_SENT_TO_DAG,  // Devis envoyé au DAG
    QUOTATION_APPROVED,     // Devis approuvé par DAG
    QUOTATION_SENT_TO_OEC,  // Devis envoyé à l'OEC
    QUOTATION_ACCEPTED,     // OEC accepte et règle
    TEAM_COMPOSED,          // Fiche composition équipe transmise
    PLAN_DRAFTED,           // Plan d'évaluation complémentaire élaboré
    PLAN_VALIDATED,         // Plan validé par RA
    PLAN_SENT_TO_OEC,       // Plan envoyé à l'OEC
    MISSION_ORDERS_ISSUED,  // Ordres de mission établis
    IN_PROGRESS,            // Évaluation complémentaire en cours
    REPORT_DRAFTING,        // Rédaction du rapport (15j max)
    REPORT_SENT,            // Rapport transmis à CD/RA
    GAPS_RESOLVED,          // Écarts critiques soldés
    GAPS_NOT_RESOLVED,      // Écarts non soldés → escalade CAS
    COMPLETED,              // Terminée
    CANCELLED               // Annulée
}
