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
    private BigDecimal travelSupplement;    // Supplément frais de déplacement

    @Column(precision = 12, scale = 2)
    private BigDecimal administrativeFee;   // Frais administratifs

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
