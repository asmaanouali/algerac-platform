package com.algerac.model;

public enum RemoteEvalStatus {
    PROPOSED,               // Proposée par RA
    PENDING_CD_APPROVAL,    // En attente approbation CD
    CD_APPROVED,            // Approuvée par le CD
    CD_REJECTED,            // Rejetée par le CD
    PENDING_OEC_CONSENT,    // En attente consentement OEC
    OEC_CONSENTED,          // OEC a consenti
    OEC_REFUSED,            // OEC a refusé
    TECH_VERIFICATION,      // Vérification technique en cours
    SCHEDULED,              // Programmée
    IN_PROGRESS,            // En cours
    COMPLETED,              // Terminée
    ONSITE_FOLLOW_UP,       // Suivi sur site nécessaire
    CANCELLED               // Annulée
}
