package com.algerac.model;

public enum ConventionStatus {
    DRAFT,              // Brouillon
    PENDING_CD_VALIDATION, // En attente validation CD
    CD_VALIDATED,       // Validée par le CD
    SENT_TO_OEC,        // Envoyée à l'OEC
    VALIDATED_BY_OEC,   // Validée par l'OEC
    REJECTED_BY_OEC     // Rejetée par l'OEC
}
