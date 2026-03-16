package com.algerac.model;

public enum SamplingPlanStatus {
    DRAFT,              // En cours de création par RA
    SUBMITTED_TO_CD,    // Soumis au CD pour validation
    CD_APPROVED,        // Approuvé par le CD
    CD_CHANGES_REQUESTED, // CD demande des modifications
    APPLIED,            // Appliqué à l'évaluation
    ARCHIVED            // Archivé après utilisation
}
