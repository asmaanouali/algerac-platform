package com.algerac.model;

public enum CASDecisionType {
    GRANT,                  // Octroi accréditation (générique)
    GRANT_FULL,             // Octroi accréditation - Portée complète
    GRANT_REDUCED,          // Octroi accréditation - Portée réduite
    GRANT_WITH_RESERVES,    // Octroi avec réserves à lever
    POSTPONEMENT,           // Ajournement - Compléments requis
    REFUSAL,                // Refus d'accréditation
    REPORT_DECISION,        // Report de décision - Infos complémentaires nécessaires
    MAINTAIN,               // Maintien accréditation (surveillance)
    MAINTAIN_WITH_ADDITIONAL_EVAL, // Maintien avec évaluation supplémentaire
    SUSPENSION,             // Suspension accréditation
    WITHDRAWAL,             // Retrait accréditation
    SCOPE_REDUCTION         // Réduction de portée
}
