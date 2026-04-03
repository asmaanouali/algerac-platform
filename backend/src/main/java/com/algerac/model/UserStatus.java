package com.algerac.model;

public enum UserStatus {
    PENDING,                   // En attente de traitement (dossier FOR20 soumis)
    PROFILE_PRESELECTED,       // Profil présélectionné par GES_COMPETENCES, en attente de FOR28
    DOCUMENTS_SUBMITTED,       // Documents FOR28 soumis, en attente de planification d'entretien
    INTERVIEW_SCHEDULED,       // Dossier présélectionné, entretien planifié
    INTERVIEW_CONFIRMED,       // Entretien confirmé par les deux parties
    INTERVIEW_COMPLETED,       // Entretien effectué, en attente de décision
    CANDIDATURE_APPROVED,      // Approuvé (OEC: par DT / Expert: par GES_COMPETENCES après entretien), compte pas encore créé
    APPROVED,                  // Compte créé par l'admin, utilisateur actif
    REJECTED                   // Rejeté (dossier ou après entretien)
}
