package com.algerac.model;

public enum GapStatus {
    IDENTIFIED,             // Écart identifié par membre
    SENT_TO_REE,            // Envoyé au REE par le membre
    KEPT_BY_REE,            // Retenu par le REE après consensus
    DISCARDED_BY_REE,       // Écarté par le REE
    SENT_TO_OEC,            // Envoyé à l'OEC (clôture)
    OEC_ACCEPTED,           // Accepté par l'OEC
    OEC_REFUSED,            // Refusé par l'OEC
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
