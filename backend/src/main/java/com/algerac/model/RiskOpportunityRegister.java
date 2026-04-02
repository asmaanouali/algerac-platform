package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PRO_30 : Registre des risques et opportunités.
 * Gestion des risques et opportunités identifiés pour l'organisme ALGERAC.
 */
@Entity
@Table(name = "risk_opportunity_registers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskOpportunityRegister {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String registerCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskType type;                  // RISK ou OPPORTUNITY

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // Classification
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskCategory category;

    @Column(columnDefinition = "TEXT")
    private String source;                  // Source/contexte du risque ou opportunité

    // Évaluation
    @Enumerated(EnumType.STRING)
    private RiskLikelihood likelihood;      // Probabilité

    @Enumerated(EnumType.STRING)
    private RiskImpact impact;              // Impact

    @Enumerated(EnumType.STRING)
    private RiskLevel level;                // Niveau global (calculé)

    // Actions de traitement
    @Column(columnDefinition = "TEXT")
    private String mitigationActions;       // Actions de mitigation / exploitation

    @Column(columnDefinition = "TEXT")
    private String actionPlan;              // Plan d'action détaillé

    private LocalDate actionDeadline;       // Date limite des actions

    @Column(columnDefinition = "TEXT")
    private String actionProgress;          // Progrès des actions

    // Responsabilité
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;                     // Créateur (RQ/CD/DT)

    private String ownerDepartment;         // Département responsable

    // Évaluation du risque résiduel (Section 5.3)
    @Column(columnDefinition = "TEXT")
    private String residualDocControl;      // Maîtrise documentaire
    @Column(columnDefinition = "TEXT")
    private String residualCompetence;      // Compétence
    @Column(columnDefinition = "TEXT")
    private String residualControlLevel;    // Contrôle
    @Enumerated(EnumType.STRING)
    private RiskMastery residualMastery;    // Niveau global de maîtrise

    // Validation workflow
    @ManyToOne
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;              // RQ qui soumet à DG

    @ManyToOne
    @JoinColumn(name = "validated_by_id")
    private User validatedBy;              // DG qui valide

    private LocalDateTime submittedAt;
    private LocalDateTime validatedAt;

    // Indicateurs
    @Column(columnDefinition = "TEXT")
    private String keyIndicators;           // Indicateurs de suivi

    // Revue périodique
    private LocalDate lastReviewDate;
    private LocalDate nextReviewDate;
    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskRegisterStatus status;

    @Column(columnDefinition = "TEXT")
    private String residualRiskNotes;       // Notes sur le risque résiduel

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = RiskRegisterStatus.IDENTIFIED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
