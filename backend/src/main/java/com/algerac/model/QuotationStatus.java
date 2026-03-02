package com.algerac.model;

public enum QuotationStatus {
    DRAFT,              // Brouillon
    SENT_TO_DAG,        // Envoyé au DAG
    APPROVED_BY_DAG,    // Approuvé par le DAG (montant fixé)
    PENDING_CD_VALIDATION, // En attente validation CD
    CD_VALIDATED,       // Validé par le CD
    SENT_TO_OEC,        // Envoyé à l'OEC
    VALIDATED_BY_OEC,   // Validé par l'OEC
    REJECTED_BY_OEC     // Rejeté par l'OEC
}
