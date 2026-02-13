package com.algerac.model;

public enum RequestStatus {
    DRAFT,                      // Brouillon
    SUBMITTED,                  // Soumise par OEC
    PENDING_PAYMENT,            // En attente de paiement
    PAYMENT_COMPLETED,          // Paiement effectué, en attente d'assignation CD
    ASSIGNED_TO_RA,             // Assignée à un RA par le CD
    RECEIVABILITY_STUDY,        // En étude de recevabilité par RA
    RECEIVABLE,                 // Déclarée recevable
    NOT_RECEIVABLE,             // Déclarée non recevable
    QUOTATION_PREPARATION,      // Préparation du devis par RA
    QUOTATION_SENT_TO_DAG,      // Devis envoyé au DAG
    QUOTATION_APPROVED_BY_DAG,  // Devis approuvé par DAG
    QUOTATION_SENT_TO_OEC,      // Devis et convention envoyés à l'OEC
    QUOTATION_VALIDATED,        // Devis et convention validés par l'OEC
    PLANNING,
    EVALUATION,
    REVIEW,
    DECISION,
    ACTIVE,
    SUSPENDED
}
