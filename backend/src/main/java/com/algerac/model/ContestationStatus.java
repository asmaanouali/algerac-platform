package com.algerac.model;

public enum ContestationStatus {
    FILED,                  // Contestation déposée par l'OEC
    EXAMINER_DESIGNATED,    // Personne non impliquée désignée par CD
    UNDER_EXAMINATION,      // En cours d'examen
    FOUNDED,                // Contestation fondée → écart modifié/supprimé
    NOT_FOUNDED,            // Contestation non fondée
    OEC_ACCEPTS,            // OEC accepte le maintien de l'écart
    OEC_MAINTAINS_POSITION, // OEC maintient sa position → escalade CAS
    ESCALATED_TO_CAS,       // Escaladé au CAS pour arbitrage
    CAS_RESOLVED,           // Résolu par le CAS
    CLOSED                  // Clôturé
}
