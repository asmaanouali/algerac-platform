package com.algerac.model;

public enum EvaluationPlanStatus {
    DRAFT,              // En préparation par REE
    SUBMITTED_TO_CD,    // Soumis au CD pour validation
    ADJUSTMENTS_NEEDED, // Ajustements demandés par CD
    VALIDATED,          // Validé par CD
    SENT_TO_OEC,        // Transmis à l'OEC
    ACTIVE              // Plan en cours d'exécution
}
