package com.algerac.model;

public enum MultiSiteStatus {
    DRAFT,              // En configuration
    SUBMITTED,          // Soumis pour validation
    CD_REVIEW,          // En revue par le CD
    VALIDATED,          // Validé
    CHANGES_REQUESTED,  // Modifications demandées
    ACTIVE,             // Actif (évaluation en cours/complétée)
    ARCHIVED            // Archivé
}
