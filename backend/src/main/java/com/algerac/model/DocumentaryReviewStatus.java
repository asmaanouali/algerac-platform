package com.algerac.model;

public enum DocumentaryReviewStatus {
    PENDING,                // En attente
    IN_PROGRESS,            // En cours
    COMPLETED_NO_ISSUES,    // Terminée sans manquements
    DEFICIENCIES_FOUND,     // Manquements identifiés
    AWAITING_OEC_RESPONSE,  // En attente de réponse OEC
    OEC_RESPONSE_ACCEPTED,  // Réponse OEC acceptée
    OEC_RESPONSE_REJECTED,  // Réponse OEC rejetée
    FILE_CLOSED             // Dossier classé
}
