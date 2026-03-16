package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PRO_19 : Règles de référence pour l'accréditation.
 * Gère les normes et référentiels applicables aux accréditations.
 */
@Entity
@Table(name = "reference_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferenceRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ruleCode;

    // Détails de la norme
    @Column(nullable = false)
    private String standardCode;            // Code de la norme (ex: ISO/IEC 17025)

    @Column(nullable = false)
    private String standardVersion;         // Version (ex: 2017)

    @Column(nullable = false)
    private String standardTitle;           // Titre complet

    @Column(columnDefinition = "TEXT")
    private String description;             // Description / résumé

    // Applicabilité
    @Column(columnDefinition = "TEXT")
    private String applicableDomains;       // Domaines d'accréditation concernés (JSON)

    @Column(columnDefinition = "TEXT")
    private String applicableOecTypes;      // Types d'OEC concernés (JSON)

    // Dates de transition
    private LocalDate publicationDate;       // Date de publication
    private LocalDate effectiveDate;         // Date d'entrée en vigueur
    private LocalDate transitionStartDate;   // Début de la période de transition
    private LocalDate transitionEndDate;     // Fin de la période de transition
    private LocalDate withdrawalDate;        // Date de retrait de l'ancienne version

    // Ancienne version remplacée
    private String previousStandardCode;
    private String previousStandardVersion;

    // Exigences de transition
    @Column(columnDefinition = "TEXT")
    private String transitionRequirements;   // Exigences pour la transition

    @Column(columnDefinition = "TEXT")
    private String guidanceDocuments;        // Documents guides associés (JSON)

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferenceRuleStatus status;

    // Suivi
    private Integer affectedOecCount;        // Nombre d'OEC affectés
    private Integer transitionCompletedCount; // Nombre d'OEC ayant complété la transition

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = ReferenceRuleStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
