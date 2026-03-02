package com.algerac.model;

public enum PaymentStatus {
    PENDING,              // En attente de paiement par OEC
    AWAITING_FEE_SETTING, // En attente que le DAG fixe les frais
    PROOF_SUBMITTED,      // OEC a soumis la preuve de paiement
    DAG_VALIDATED,        // DAG a validé le paiement
    DAG_REJECTED,         // DAG a rejeté le paiement
    COMPLETED,            // Payé (ancien statut, gardé pour compatibilité)
    FAILED,               // Échec
    CANCELLED             // Annulé
}
