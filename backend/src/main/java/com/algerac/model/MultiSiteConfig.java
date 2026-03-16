package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_26 : Configuration d'accréditation multi-sites.
 * Gère les sites satellites, l'échantillonnage et le calendrier d'évaluation.
 */
@Entity
@Table(name = "multi_site_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiSiteConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @Column(nullable = false, unique = true)
    private String configCode;

    // Site principal
    @Column(nullable = false)
    private String mainSiteName;

    @Column(columnDefinition = "TEXT")
    private String mainSiteAddress;

    private String mainSiteContactName;
    private String mainSiteContactEmail;

    // Système de management centralisé
    private Boolean centralizedManagementSystem;
    @Column(columnDefinition = "TEXT")
    private String managementSystemDescription;

    // Sites satellites (stockés en JSON)
    private Integer totalSatelliteSites;
    @Column(columnDefinition = "TEXT")
    private String satelliteSites;           // JSON: [{name, address, activities, personnel}]

    // Plan d'échantillonnage des sites
    private Integer sitesToEvaluateInitial;   // Sites à évaluer lors de l'évaluation initiale
    private Integer sitesToEvaluateAnnual;    // Sites à évaluer annuellement
    @Column(columnDefinition = "TEXT")
    private String siteSelectionCriteria;     // Critères de sélection des sites

    @Column(columnDefinition = "TEXT")
    private String siteSamplingJustification; // Justification de l'échantillonnage

    // Calendrier d'évaluation
    @Column(columnDefinition = "TEXT")
    private String evaluationSchedule;        // Calendrier multi-cycle (JSON)

    private Integer cycleDurationYears;       // Durée du cycle complet (généralement 4 ans)

    // Évaluation
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;        // Constatations par site (JSON)

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MultiSiteStatus status;

    @ManyToOne
    @JoinColumn(name = "validated_by_id")
    private User validatedBy;

    private LocalDateTime validationDate;
    @Column(columnDefinition = "TEXT")
    private String validationComments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = MultiSiteStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
