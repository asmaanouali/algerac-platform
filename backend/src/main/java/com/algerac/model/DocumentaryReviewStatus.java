package com.algerac.model;

public enum DocumentaryReviewStatus {
    PENDING,                // En attente
    AWAITING_FEE,           // En attente fixation frais par DAG
    FEE_SET,                // Frais fixés, en attente paiement OEC
    PAYMENT_SUBMITTED,      // OEC a soumis preuve de paiement
    PAYMENT_VALIDATED,      // DAG a validé le paiement
    IN_PROGRESS,            // Documents transmis à l'équipe (15j max)
    RESULTS_SUBMITTED,      // Résultats soumis par l'équipe
    RESULTS_SENT_TO_CD,     // Résultats envoyés au CD
    RESULTS_SENT_TO_OEC,    // Résultats/synthèse envoyés à l'OEC
    AWAITING_OEC_RESPONSE,  // En attente de réponse OEC (3 mois max)
    CD_DECISION_CONTINUE,   // CD décide de poursuivre
    CD_DECISION_STOP,       // CD décide d'arrêter
    COMPLETED_NO_ISSUES,    // Terminée sans manquements
    DEFICIENCIES_FOUND,     // Manquements identifiés (legacy)
    OEC_RESPONSE_ACCEPTED,  // Réponse OEC acceptée (legacy)
    OEC_RESPONSE_REJECTED,  // Réponse OEC rejetée (legacy)
    FILE_CLOSED             // Dossier classé
}
