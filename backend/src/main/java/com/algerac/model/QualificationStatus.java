package com.algerac.model;

public enum QualificationStatus {
    PENDING_TRAINING,       // En attente de formation initiale
    TRAINING_IN_PROGRESS,   // Formation en cours
    TRAINING_COMPLETED,     // Formation terminée, examen réussi (≥70%)
    TRAINING_FAILED,        // Examen échoué
    OBSERVER_PHASE,         // Phase d'observation (étape 1)
    PRACTICE_PHASE,         // Phase de mise en situation (étape 2)
    PENDING_COMMISSION,     // En attente de passage en Commission de Qualification
    QUALIFIED,              // Qualifié (décision CQ favorable)
    RENEWAL_PENDING,        // En attente de renouvellement (fin de cycle 3 ans)
    RENEWED,                // Qualification renouvelée
    EXTENSION_PENDING,      // Extension de domaine en cours
    SUSPENDED,              // Qualification suspendue
    WITHDRAWN               // Qualification retirée définitivement
}
