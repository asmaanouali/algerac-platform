package com.algerac.model;

/**
 * PRO_29 — États du cycle de vie d'une évaluation à distance.
 */
public enum RemoteEvalStatus {
    // Phase 1 : Analyse des risques (§5.3)
    RISK_ANALYSIS_PENDING,      // Analyse des risques (FOR 77-1) en attente
    RISK_ANALYSIS_COMPLETED,    // Analyse des risques complétée – résultat acceptable
    RISK_ANALYSIS_REJECTED,     // Résultat de l'analyse des risques non acceptable

    // Phase 2 : Approbation CD
    PENDING_CD_APPROVAL,        // En attente d'approbation du CD
    CD_APPROVED,                // Approuvée par le CD
    CD_REJECTED,                // Rejetée par le CD

    // Phase 3 : Consentement OEC
    PENDING_OEC_CONSENT,        // En attente consentement de l'OEC
    OEC_CONSENTED,              // OEC a consenti
    OEC_REFUSED,                // OEC a refusé

    // Phase 4 : Vérification technique (§5.5)
    TECH_VERIFICATION,          // Vérification technique en cours
    TECH_VERIFICATION_FAILED,   // Échec vérification technique

    // Phase 5 : Planification & Confidentialité (§5.3, §5.4)
    SCHEDULED,                  // Programmée, confidentialité confirmée (FOR 01-1)

    // Phase 6 : Déroulement de l'évaluation (§5.6)
    OPENING_MEETING,            // Réunion d'ouverture (PRO 12)
    IN_PROGRESS,                // Évaluation en cours
    CLOSING_MEETING,            // Réunion de clôture

    // Phase 7 : Post-évaluation
    PENDING_DEVIATION_SHEETS,   // Fiches d'écarts en cours d'envoi (24h max)
    PENDING_OEC_VALIDATION,     // En attente de validation des documents par l'OEC (24h max)
    PENDING_CAS_DECISION,       // En attente de décision du CAS (PRO 16)
    COMPLETED,                  // Terminée
    ONSITE_FOLLOW_UP,           // Suivi sur site nécessaire

    // Évaluation à distance non réalisable (§5.7)
    NOT_FEASIBLE_DESK_REVIEW,   // Revue documentaire approfondie en remplacement

    // Annulation
    CANCELLED                   // Annulée / reportée
}
