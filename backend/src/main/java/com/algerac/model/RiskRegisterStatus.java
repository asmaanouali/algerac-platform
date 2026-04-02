package com.algerac.model;

public enum RiskRegisterStatus {
    IDENTIFIED,         // Identifié (brainstorming CD+DT+RQ)
    ANALYZED,           // Analysé (conséquence + vraisemblance renseignées)
    PENDING_VALIDATION, // Soumis à la DG pour vérification
    VALIDATED,          // Validé par la DG (et diffusé au CA)
    IN_TREATMENT,       // Plan d'action en cours de mise en œuvre
    MONITORED,          // Suivi et revue (efficacité évaluée)
    CLOSED              // Clôturé
}
