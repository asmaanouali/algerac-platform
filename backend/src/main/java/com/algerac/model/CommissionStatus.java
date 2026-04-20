package com.algerac.model;

public enum CommissionStatus {
    PLANNED,    // Planifiée
    CONVENED,   // Convoquée (FOR 105 envoyé)
    IN_SESSION, // En cours de séance
    COMPLETED   // Terminée, PV rédigé (FOR 106)
}
