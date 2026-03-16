package com.algerac.model;

public enum ReferenceRuleStatus {
    DRAFT,              // En cours d'élaboration
    PUBLISHED,          // Publiée et applicable
    IN_TRANSITION,      // Période de transition en cours
    ACTIVE,             // Active (transition terminée)
    WITHDRAWN,          // Retirée
    ARCHIVED            // Archivée
}
