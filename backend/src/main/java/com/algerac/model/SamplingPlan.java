package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_13-1 : Plan d'échantillonnage pour les évaluations de laboratoires et d'inspection.
 * Couvre l'échantillonnage des sites, de la portée et du personnel (§5.1, §5.2, §5.3).
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
    private SamplingPlanType planType; // LABORATORY, INSPECTION, MEDICAL_LAB, CALIBRATION

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType assessmentType; // INITIAL, SURVEILLANCE, RENOUVELLEMENT, EXTENSION

    // ---- §5.1/§5.2 SCOPE SAMPLING (Échantillonnage de la portée) ----
    @Column(columnDefinition = "TEXT")
    private String methodology;

    private Integer totalMethodsInScope;
    private Integer selectedMethodsCount;
    @Column(columnDefinition = "TEXT")
    private String selectedMethods; // JSON array of method details

    private Integer numberOfAssessmentsInCycle; // nb évaluations dans le cycle (pour calcul §5.2.b)
    private Integer accreditationCycleYears;    // durée du cycle (typiquement 4 ou 5 ans)

    // ---- §5.1.a/§5.2.a SITE SAMPLING (Échantillonnage des sites) ----
    private Integer totalSitesInScope;
    private Integer selectedSitesCount;
    @Column(columnDefinition = "TEXT")
    private String selectedSites; // JSON array of site details
    private Boolean headquartersIncluded; // §5.2.a: siège systématiquement évalué

    // ---- §5.1.c/§5.2.c PERSONNEL SAMPLING (Échantillonnage du personnel) ----
    private Integer totalPersonnelCount;        // Total personnel OEC
    private Integer selectedPersonnelCount;     // Personnel sélectionné pour évaluation
    @Column(columnDefinition = "TEXT")
    private String selectedPersonnel;           // JSON: list of selected personnel details
    private Integer totalSignatories;           // Nombre total de signataires
    private Integer selectedSignatories;        // Signataires sélectionnés
    private Integer totalInspectors;            // Nombre total d'inspecteurs
    private Integer selectedInspectors;         // Inspecteurs sélectionnés
    private Integer totalTechnicians;           // Nombre total de techniciens
    private Integer selectedTechnicians;        // Techniciens sélectionnés
    private Boolean allCompetenceFilesReviewed; // §5.1.c: tous les dossiers de compétence examinés
    private Boolean newRecruitsIncluded;        // §5.2.c: nouvelles recrues incluses
    private Boolean newClearancesIncluded;      // §5.2.c: nouvelles habilitations incluses

    // ---- SELECTION CRITERIA & RISK ----
    @Column(columnDefinition = "TEXT")
    private String selectionCriteria;
    @Column(columnDefinition = "TEXT")
    private String riskFactors;               // §5.3: facteurs de risque identifiés
    @Column(columnDefinition = "TEXT")
    private String riskAnalysisNotes;         // §5.3: analyse des risques détaillée

    // ---- JUSTIFICATION & COVERAGE ----
    @Column(columnDefinition = "TEXT")
    private String justification;
    private Boolean coversAllDomains;          // Couvre tous les domaines techniques
    private Boolean coversKeyPersonnel;        // Couvre le personnel clé
    @Column(columnDefinition = "TEXT")
    private String coverageNotes;

    // ---- HISTORICAL REFERENCES (§5.2) ----
    @Column(columnDefinition = "TEXT")
    private String internalAuditResults;       // §5.2.b/c: résultats des audits internes
    @Column(columnDefinition = "TEXT")
    private String managementReviewResults;    // §5.2.b: résultats de la revue de direction
    @Column(columnDefinition = "TEXT")
    private String findingsHistory;            // §5.2.b: historique des écarts
    private LocalDateTime lastScopeObservationDate; // §5.2.b: dernière observation (max 2 ans)

    // ---- WORKFLOW STATUS ----
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SamplingPlanStatus status;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    private LocalDateTime approvalDate;
    @Column(columnDefinition = "TEXT")
    private String approvalComments;

    @ManyToOne
    @JoinColumn(name = "superseded_by_id")
    private SamplingPlan supersededBy;

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
