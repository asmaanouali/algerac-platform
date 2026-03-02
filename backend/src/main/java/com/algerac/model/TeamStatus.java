package com.algerac.model;

public enum TeamStatus {
    DRAFT,                  // En constitution
    SENT_TO_CD,             // Envoyée au CD pour validation
    CD_APPROVED,            // Approuvée par le CD
    CD_CHANGES_REQUESTED,   // CD demande des changements au RA
    SENT_TO_OEC,            // Envoyée à l'OEC pour validation
    DATE_REFUSED,           // OEC accepte équipe mais refuse la date
    MEMBER_RECUSED,         // OEC accepte date mais récuse un membre
    RECUSED,                // Membre(s) récusé(s) par OEC (legacy)
    RECUSATION_INVALID,     // CD juge la récusation non valide, équipe maintenue
    VALIDATED,              // Validée par l'OEC
    ACTIVE                  // Équipe active en évaluation
}
