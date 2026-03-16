package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_13-1 : Plan d'échantillonnage pour les évaluations de laboratoires et d'inspection.
 * Définit la méthodologie d'échantillonnage des méthodes/sites à évaluer.
 */
@Entity
@Table(name = "sampling_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SamplingPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @Column(nullable = false, unique = true)
    private String planCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SamplingPlanType planType; // LABORATORY, INSPECTION

    // Méthodologie d'échantillonnage
    @Column(columnDefinition = "TEXT")
    private String methodology; // Approche utilisée (aléatoire, stratifiée, etc.)

    private Integer totalMethodsInScope;      // Nombre total de méthodes dans la portée
    private Integer selectedMethodsCount;     // Nombre de méthodes sélectionnées
    @Column(columnDefinition = "TEXT")
    private String selectedMethods;           // Détail des méthodes sélectionnées (JSON)

    private Integer totalSitesInScope;        // Nombre total de sites
    private Integer selectedSitesCount;       // Nombre de sites sélectionnés
    @Column(columnDefinition = "TEXT")
    private String selectedSites;             // Détail des sites sélectionnés (JSON)

    // Critères de sélection
    @Column(columnDefinition = "TEXT")
    private String selectionCriteria;         // Critères ayant guidé la sélection
    @Column(columnDefinition = "TEXT")
    private String riskFactors;               // Facteurs de risque pris en compte

    // Justification
    @Column(columnDefinition = "TEXT")
    private String justification;             // Justification de l'échantillon retenu

    // Couverture
    private Boolean coversAllDomains;         // Couvre tous les domaines techniques ?
    private Boolean coversKeyPersonnel;       // Couvre le personnel clé ?
    @Column(columnDefinition = "TEXT")
    private String coverageNotes;

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SamplingPlanStatus status;

    // Approbation
    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvalDate;
    @Column(columnDefinition = "TEXT")
    private String approvalComments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = SamplingPlanStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
