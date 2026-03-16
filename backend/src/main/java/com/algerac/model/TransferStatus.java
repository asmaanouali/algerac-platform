package com.algerac.model;

public enum TransferStatus {
    INITIATED,              // Demande initiée
    DOCUMENTS_SUBMITTED,    // Documents soumis
    UNDER_REVIEW,           // En cours d'examen
    EVALUATION_REQUIRED,    // Évaluation nécessaire
    EVALUATION_IN_PROGRESS, // Évaluation en cours
    EVALUATION_COMPLETED,   // Évaluation terminée
    PENDING_CAS_DECISION,   // En attente de décision CAS
    APPROVED,               // Transfert approuvé
    REJECTED,               // Transfert rejeté
    CERTIFICATE_ISSUED,     // Nouveau certificat émis
    COMPLETED,              // Transfert complété
    CANCELLED               // Annulé
}
