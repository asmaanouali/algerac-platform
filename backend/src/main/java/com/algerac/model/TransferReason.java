package com.algerac.model;

public enum TransferReason {
    PARENT_REORGANIZATION,  // Réorganisation au niveau de la société mère (§5.1)
    SUBSIDIARY_CREATION,    // Création d'une filiale (§5.1)
    SCOPE_CESSION,          // Cession de portée à une autre entité juridique (§5.1)
    MERGER,                 // Fusion de deux OEC (§5.1)
    LEGAL_RESTRUCTURING,    // Restructuration juridique
    ACQUISITION,            // Acquisition
    NAME_CHANGE,            // Changement de dénomination
    LOCATION_CHANGE,        // Changement de localisation
    SPIN_OFF,               // Scission
    OTHER                   // Autre motif
}
