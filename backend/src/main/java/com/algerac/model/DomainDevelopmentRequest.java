package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_17 : Demande de développement d'un nouveau domaine d'activité d'accréditation.
 * Couvre l'étude de faisabilité, la formation des évaluateurs,
 * et la mise en place des compétences nécessaires.
 */
@Entity
@Table(name = "domain_development_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DomainDevelopmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String requestCode;

    @Column(nullable = false)
    private String domainName;              // Nom du domaine proposé

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;             // Description du domaine

    @Column(columnDefinition = "TEXT")
    private String regulatoryBasis;         // Base réglementaire justifiant le besoin

    @Column(columnDefinition = "TEXT")
    private String marketDemand;            // Demande du marché / nombre d'OEC potentiels

    // Étude de faisabilité
    @Column(columnDefinition = "TEXT")
    private String feasibilityStudy;        // Résultat de l'étude de faisabilité

    private Boolean competentEvaluatorsAvailable; // Évaluateurs compétents disponibles ?
    private Integer estimatedEvaluatorCount;       // Nombre d'évaluateurs nécessaires

    @Column(columnDefinition = "TEXT")
    private String trainingPlan;            // Plan de formation des évaluateurs

    @Column(columnDefinition = "TEXT")
    private String applicableStandards;     // Normes applicables (ISO, etc.)

    @Column(columnDefinition = "TEXT")
    private String resourceRequirements;    // Ressources nécessaires

    // Workflow
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DomainDevStatus status;

    @ManyToOne
    @JoinColumn(name = "requested_by_id")
    private User requestedBy;

    @ManyToOne
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(columnDefinition = "TEXT")
    private String reviewComments;

    @ManyToOne
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;               // DG approval

    private LocalDateTime reviewDate;
    private LocalDateTime approvalDate;
    private LocalDateTime implementationDate; // Date de mise en œuvre effective

    @Column(columnDefinition = "TEXT")
    private String implementationNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = DomainDevStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
