package com.algerac.model;

public enum EvaluationPlanStatus {
    DRAFT,              // En préparation par REE
    SUBMITTED_TO_RA,    // Soumis au RA pour validation
    SUBMITTED_TO_CD,    // Soumis au CD pour validation (legacy)
    RA_ADJUSTMENTS_NEEDED, // RA demande des ajustements au REE
    RA_APPROVED,        // Validé par le RA
    PENDING_CD,         // En attente validation CD
    ADJUSTMENTS_NEEDED, // Ajustements demandés par CD
    CD_VALIDATED,       // Validé par le CD
    VALIDATED,          // Validé (legacy compat)
    SENT_TO_OEC,        // Transmis à l'OEC
    ACTIVE              // Plan en cours d'exécution
}
