package com.algerac.model;

public enum SupervisionPlanStatus {
    PLANNED,        // Planifié
    ASSIGNED,       // Superviseur assigné à une mission concrète
    COMPLETED,      // Supervision réalisée + fiche soumise
    MISSED,         // Manquée (à replanifier)
    RESCHEDULED     // Replanifiée
}
