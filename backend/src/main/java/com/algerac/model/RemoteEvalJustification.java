package com.algerac.model;

/**
 * PRO_29 §5.2 — Critères de recours à l'évaluation à distance.
 */
public enum RemoteEvalJustification {
    EXTRAORDINARY_EVENTS,       // Événements extraordinaires (épidémie, pandémie, grève, instabilité politique…)
    TRAVEL_IMPOSSIBLE,          // Déplacement impossible (sécurité, restrictions de voyage…)
    MULTIPLE_SITES,             // Nombre important de sites à évaluer dans le délai prévu
    MINOR_SCOPE_EXTENSION,      // Extension mineure de la portée de l'accréditation
    TEAM_UNAVAILABILITY,        // Indisponibilité de l'équipe d'évaluation (force majeure)
    SUPPLEMENTARY_ASSESSMENT    // Évaluation complémentaire/supplémentaire rapprochée de l'évaluation initiale
}
