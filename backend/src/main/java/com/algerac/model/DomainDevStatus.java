package com.algerac.model;

public enum DomainDevStatus {
    DRAFT,                  // En brouillon
    SUBMITTED,              // Soumise pour étude
    FEASIBILITY_STUDY,      // Étude de faisabilité en cours
    FEASIBILITY_COMPLETED,  // Étude de faisabilité terminée
    REVIEWED_BY_DT,         // Revue par la Direction Technique
    PENDING_DG_APPROVAL,    // En attente d'approbation DG
    APPROVED,               // Approuvée par la DG
    REJECTED,               // Rejetée
    IMPLEMENTATION,         // En cours de mise en œuvre
    ACTIVE,                 // Domaine actif et opérationnel
    SUSPENDED               // Domaine suspendu
}
