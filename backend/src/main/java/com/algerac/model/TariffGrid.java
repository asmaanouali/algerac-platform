package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PRO_18 / PRO_18-1 : Grille tarifaire pour les frais d'accréditation.
 * Couvre les tarifs des OEC nationaux (PRO_18) et étrangers (PRO_18-1).
 */
@Entity
@Table(name = "tariff_grids")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffGrid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String tariffCode;

    @Column(nullable = false)
    private String name;                    // Nom du tarif

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TariffCategory category;        // Catégorie de tarif

    // Applicabilité
    private Boolean forNationalOEC;         // Applicable aux OEC nationaux (PRO_18)
    private Boolean forForeignOEC;          // Applicable aux OEC étrangers (PRO_18-1)

    @Column(nullable = false)
    private String applicableDomain;        // Domaine d'accréditation concerné

    @Column(nullable = false)
    private String oecType;                 // Type d'OEC (labo, inspection, certification, etc.)

    // Montants
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal registrationFee;     // Frais d'enregistrement du dossier

    @Column(precision = 12, scale = 2)
    private BigDecimal evaluationFeePerDay; // Frais d'évaluation par jour/homme

    @Column(precision = 12, scale = 2)
    private BigDecimal documentReviewFee;   // Frais de revue documentaire

    @Column(precision = 12, scale = 2)
    private BigDecimal surveillanceFee;     // Frais de surveillance annuelle

    @Column(precision = 12, scale = 2)
    private BigDecimal renewalFee;          // Frais de renouvellement

    @Column(precision = 12, scale = 2)
    private BigDecimal extensionFee;        // Frais d'extension de portée

    @Column(precision = 12, scale = 2)
    private BigDecimal travelSupplement;    // Supplément frais de déplacement (OEC étrangers PRO18-1)

    @Column(precision = 12, scale = 2)
    private BigDecimal administrativeFee;   // Frais administratifs

    // Section 5.4 / 5.5 PRO18 - Certificat et redevance annuelle
    @Column(precision = 12, scale = 2)
    private BigDecimal annualFee;           // Redevance annuelle (base 12 mois) — proratée: (annualFee/12)×M

    @Column(precision = 12, scale = 2)
    private BigDecimal certificateDeliveryFee;    // Délivrance certificat + annexes techniques (5.4 PRO18)

    @Column(precision = 12, scale = 2)
    private BigDecimal certificateModificationFee; // Modification certificat/annexes (surveillance avec changement)

    @Column(precision = 12, scale = 2)
    private BigDecimal certificateTranslationFee;  // Traduction certificat (sur demande OEC) (5.16 PRO18-1)

    // Section 5.11 PRO18 - Levée de suspension
    @Column(precision = 12, scale = 2)
    private BigDecimal suspensionLiftFee;   // Frais de levée de suspension (documental ou visite sur site)

    // Section 5.12 PRO18 - Transfert d'accréditation (forfaitaire)
    @Column(precision = 12, scale = 2)
    private BigDecimal transferFlatRate;    // Montant forfaitaire pour transfert d'accréditation

    // Section 5.13 PRO18 - Multi-sites (Annexe 2)
    @Column(precision = 12, scale = 2)
    private BigDecimal multiSiteAdditionalSiteFee; // Supplément par site additionnel

    // Délais de paiement (PRO18 Section 6)
    @Builder.Default
    private Integer paymentTermDaysEvaluation = 20; // Délai paiement frais évaluation = 20 jours (§6 PRO18)

    @Builder.Default
    private Integer paymentTermDaysAnnual = 60;     // Délai paiement redevance annuelle = 60 jours (§5.5/5.17 PRO18)

    // Devise applicable
    private String currency;                // "DZD" pour OEC nationaux, "EUR" ou "USD" pour OEC étrangers (PRO18-1)

    // Durée d'évaluation standard (en jours/homme)
    private Integer standardEvaluationDaysMin;
    private Integer standardEvaluationDaysMax;

    // Validité
    private LocalDateTime effectiveDate;    // Date d'entrée en vigueur
    private LocalDateTime expirationDate;   // Date d'expiration

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TariffStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvalDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = TariffStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
