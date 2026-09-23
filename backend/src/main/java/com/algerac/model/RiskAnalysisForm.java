package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_analysis_forms")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAnalysisForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surveillance_plan_id")
    private SurveillancePlan surveillancePlan;

    @Column(nullable = false, unique = true)
    private String formCode; // FOR 77-1

    // Questions FOR 77-1
    private Boolean organizationChanges; // Changements organisation OEC ?
    @Column(columnDefinition = "TEXT")
    private String organizationChangesDetails;

    private Boolean scopeModifications; // Modifications portée ?
    @Column(columnDefinition = "TEXT")
    private String scopeModificationsDetails;

    private Boolean complaintsReceived; // Plaintes reçues ?
    @Column(columnDefinition = "TEXT")
    private String complaintsDetails;

    private Boolean qualityIncidents; // Incidents qualité ?
    @Column(columnDefinition = "TEXT")
    private String qualityIncidentsDetails;

    private Boolean keyPersonnelChanges; // Changements personnel clé ?
    @Column(columnDefinition = "TEXT")
    private String keyPersonnelChangesDetails;

    private Boolean newSites; // Nouveaux sites ?
    @Column(columnDefinition = "TEXT")
    private String newSitesDetails;

    private Boolean managementSystemChanges; // Modifications système management ?
    @Column(columnDefinition = "TEXT")
    private String managementSystemChangesDetails;

    // Analyse par RA
    @Column(columnDefinition = "TEXT")
    private String raAnalysis;
    private Boolean scopeAdjustmentNeeded; // Ajustement portée surveillance nécessaire ?
    @Column(columnDefinition = "TEXT")
    private String adjustedScope; // Portée ajustée si nécessaire
    private Boolean additionalEvaluationNeeded; // Évaluation supplémentaire requise ?

    // Statut
    private Boolean sentToOEC;
    private LocalDateTime sentToOECDate;
    private Boolean completedByOEC;
    private LocalDateTime completedByOECDate;
    private Boolean analyzedByRA;
    private LocalDateTime analyzedByRADate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
