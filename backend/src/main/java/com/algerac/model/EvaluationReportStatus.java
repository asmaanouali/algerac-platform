package com.algerac.model;

public enum EvaluationReportStatus {
    DRAFT,                  // En rédaction par REE
    SUBMITTED_TO_CD,        // Soumis au CD pour validation
    CORRECTIONS_NEEDED,     // Corrections demandées
    VALIDATED,              // Validé
    SENT_TO_CONSOLIDATION   // Transmis au Département Consolidation
}
