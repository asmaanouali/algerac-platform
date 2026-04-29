package com.algerac.model;

/**
 * PRO 26 §5.5-4 : statut d'un site satellite.
 * - ACTIVE : site en activité, inclus dans le périmètre d'accréditation.
 * - CLOSED : site fermé (déclaré par l'OEC) ; doit être retiré de l'annexe technique.
 */
public enum SatelliteSiteStatus {
    ACTIVE,
    CLOSED
}
