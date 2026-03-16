package com.algerac.model;

public enum RiskRegisterStatus {
    IDENTIFIED,     // Identifié
    ANALYZING,      // En cours d'analyse
    TREATMENT_PLAN, // Plan de traitement défini
    IN_TREATMENT,   // En cours de traitement
    MONITORED,      // Sous surveillance
    MITIGATED,      // Atténué / exploité
    ACCEPTED,       // Accepté (risque résiduel acceptable)
    CLOSED          // Clôturé
}
