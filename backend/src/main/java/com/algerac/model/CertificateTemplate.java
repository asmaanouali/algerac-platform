package com.algerac.model;

/**
 * Template du certificat d'accréditation.
 * - FOR_16   : monosite (par défaut)
 * - FOR_16_1 : multisites — portées reconnues par l'EA (PRO 26 §5.5-1)
 * - FOR_16_3 : multisites — portées non reconnues par l'EA (PRO 26 §5.5-1)
 */
public enum CertificateTemplate {
    FOR_16,
    FOR_16_1,
    FOR_16_3
}
