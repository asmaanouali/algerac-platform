package com.algerac.model;

public enum MandateStatus {
    DRAFT,                  // Brouillon par le RA
    SENT_TO_CD,             // Envoyé au CD pour validation
    CD_APPROVED,            // Approuvé par le CD
    CD_MODIFICATION_REQUESTED, // CD demande des modifications
    SENT_TO_MEMBERS         // Envoyé aux membres de l'équipe
}
