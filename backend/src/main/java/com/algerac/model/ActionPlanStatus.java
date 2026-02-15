package com.algerac.model;

public enum ActionPlanStatus {
    PENDING,                    // En attente de soumission OEC
    SUBMITTED,                  // Soumis par OEC
    UNDER_EVALUATION,           // En cours d'évaluation par l'équipe
    ACCEPTED,                   // Accepté par l'équipe  
    REJECTED,                   // Rejeté par l'équipe
    IMPLEMENTATION_IN_PROGRESS, // Mise en œuvre en cours
    EVIDENCE_SUBMITTED,         // Preuves soumises
    VERIFIED,                   // Vérifié et validé
    COMPLETED                   // Complété
}
