package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * FOR 65-1 (externe) / FOR 65-6 (permanent) — Fiche de qualification et suivi des compétences (PRO 06 §5.5).
 * Établie en fin de cycle (3 ans externe, 6 ans permanent) par CD/DT pour décision triennale.
 */
@Entity
@Table(name = "evaluator_monitoring_sheets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluatorMonitoringSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne
    @JoinColumn(name = "qualification_id")
    private Qualification qualification;

    @ManyToOne
    @JoinColumn(name = "filled_by_id")
    private User filledBy; // CD (externe) ou DT (permanent)

    /** True = FOR 65-6 (permanent), False = FOR 65-1 (externe). */
    private Boolean isPermanent;

    private LocalDate cycleStartDate;
    private LocalDate cycleEndDate;

    // Agrégats du cycle
    private Integer totalMissionsInCycle;
    private LocalDate lastObservationDate;
    private LocalDate lastRecyclingDate;
    private Integer recyclingParticipations;
    private Double avgObservationScore;
    private Double avgSatisfactionScore;

    // Décision proposée par CD/DT
    @Column(length = 40)
    private String proposedDecision; // RENOUVELLEMENT / EXTENSION / REDUCTION / RADIATION / FORMATION_COMPLEMENTAIRE

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    private Boolean validatedByDirection;
    private LocalDate validatedDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
