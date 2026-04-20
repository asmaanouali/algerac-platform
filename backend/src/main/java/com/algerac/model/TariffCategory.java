package com.algerac.model;

public enum TariffCategory {
    INITIAL_ACCREDITATION,      // Première accréditation (5.2 PRO18)
    SURVEILLANCE,               // Surveillance périodique (5.6 PRO18)
    RENEWAL,                    // Renouvellement (5.7 PRO18)
    EXTENSION,                  // Extension de portée (5.8 PRO18)
    EXTENSION_WITH_SURVEILLANCE,// Extension combinée à une surveillance (5.8 PRO18 - 50/50 + 30% réduction)
    TRANSFER,                   // Transfert d'accréditation forfaitaire (5.12 PRO18)
    PRELIMINARY_VISIT,          // Visite préliminaire
    COMPLEMENTARY_EVALUATION,   // Évaluation complémentaire (5.9 PRO18)
    ADDITIONAL_EVALUATION,      // Évaluation supplémentaire (5.10 PRO18)
    DOCUMENT_REVIEW,            // Revue documentaire (5.3 PRO18)
    REMOTE_EVALUATION,          // Évaluation à distance
    MULTISITE,                  // Accréditation multi-sites (5.13 PRO18)
    SUSPENSION_LIFT,            // Levée de suspension (5.11 PRO18)
    CERTIFICATE_DELIVERY,       // Délivrance/modification/traduction certificat (5.14 PRO18)
    ANNUAL_FEE                  // Redevance annuelle - (annualFee/12) × M (5.5 PRO18)
}
