package com.algerac.model;

public enum UserStatus {
    PENDING,               // En attente de traitement
    CANDIDATURE_APPROVED,  // Approuvé (OEC: par DT / Expert: par GES_COMPETENCES), compte pas encore créé
    APPROVED,              // Compte créé par l'admin, utilisateur actif
    REJECTED               // Rejeté
}
