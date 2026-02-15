package com.algerac.model;

public enum GapStatus {
    IDENTIFIED,             // Écart identifié
    AWAITING_ACTION_PLAN,   // En attente du plan d'action OEC
    PLAN_SUBMITTED,         // Plan d'action soumis  
    PLAN_ACCEPTED,          // Plan d'action accepté
    PLAN_REJECTED,          // Plan d'action rejeté
    IMPLEMENTATION,         // Mise en œuvre des actions
    EVIDENCE_PROVIDED,      // Preuves fournies
    PENDING_VERIFICATION,   // En attente de vérification
    RESOLVED,               // Écart soldé/résolu
    NEEDS_COMPLEMENTARY_EVAL // Nécessite évaluation complémentaire
}
