package com.algerac.model;

public enum AccreditationDomain {

    // a) Testing Laboratories — 6 committees (PRO 07 §5.1)
    BIOLOGIE_AGROALIMENTAIRE("Biologie et Agro-Alimentaire"),
    BATIMENT_GENIE_CIVIL("Bâtiment – Génie Civil"),
    MATERIAUX("Matériaux"),
    EQUIPEMENT_INDUSTRIEL("Équipement Industriel"),
    ENVIRONNEMENT("Environnement"),
    ENERGIE("Énergie"),

    // b–g) Other activities — 1 committee each
    INSPECTION("Inspection"),
    ETALONNAGE("Étalonnage"),
    CERTIFICATION_SYSTEMES_MANAGEMENT("Certification des Systèmes de Management"),
    CERTIFICATION_PRODUITS_PROCEDES_SERVICES("Certification Produits, Procédés et Services"),
    BIOLOGIE_MEDICALE("Biologie Médicale"),
    CERTIFICATION_PERSONNES("Certification de Personnes");

    public final String label;

    AccreditationDomain(String label) {
        this.label = label;
    }

    /** Attempt to match a free-text domain string to an enum value. */
    public static AccreditationDomain fromLabel(String text) {
        if (text == null || text.isBlank()) return null;
        String t = text.toLowerCase();
        if (t.contains("biologie") && (t.contains("agro") || t.contains("alimentaire"))) return BIOLOGIE_AGROALIMENTAIRE;
        if (t.contains("bâtiment") || t.contains("batiment") || t.contains("génie civil") || t.contains("genie civil")) return BATIMENT_GENIE_CIVIL;
        if (t.contains("matériau") || t.contains("materiau")) return MATERIAUX;
        if (t.contains("équipement") || t.contains("equipement") || t.contains("industriel")) return EQUIPEMENT_INDUSTRIEL;
        if (t.contains("environnement")) return ENVIRONNEMENT;
        if (t.contains("énergie") || t.contains("energie")) return ENERGIE;
        if (t.contains("inspection")) return INSPECTION;
        if (t.contains("étalonnage") || t.contains("etalonnage") || t.contains("calibration")) return ETALONNAGE;
        if (t.contains("système") || t.contains("systeme") || t.contains("management")) return CERTIFICATION_SYSTEMES_MANAGEMENT;
        if (t.contains("produit") || t.contains("procédé") || t.contains("procede") || t.contains("service")) return CERTIFICATION_PRODUITS_PROCEDES_SERVICES;
        if (t.contains("médical") || t.contains("medical") || t.contains("biologie médicale")) return BIOLOGIE_MEDICALE;
        if (t.contains("personne") || t.contains("person")) return CERTIFICATION_PERSONNES;
        return null;
    }
}
