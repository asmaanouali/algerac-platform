package com.algerac.model;

public enum TeamStatus {
    DRAFT,                  // En constitution
    SENT_TO_OEC,            // Envoyée à l'OEC pour validation
    RECUSED,                // Membre(s) récusé(s) par OEC
    VALIDATED,              // Validée par l'OEC
    ACTIVE                  // Équipe active en évaluation
}
