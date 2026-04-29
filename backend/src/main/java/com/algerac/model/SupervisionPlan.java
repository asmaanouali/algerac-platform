package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * FOR 65-7 — Plan triennal de supervision (PRO 06 §5.5).
 * Chaque évaluateur (REE/EQ/ET) doit être supervisé au moins une fois tous les 3 ans pour chaque statut.
 */
@Entity
@Table(name = "supervision_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupervisionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Année de planification (cycle triennal). */
    private Integer planYear;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne
    @JoinColumn(name = "supervisor_id")
    private User supervisor;

    @ManyToOne
    @JoinColumn(name = "qualification_id")
    private Qualification qualification;

    /** Rôle évalué (REE/EQ/ET/EXP). */
    @Enumerated(EnumType.STRING)
    private TeamRole supervisedRole;

    private LocalDate plannedDate;
    private LocalDate completedDate;

    /** Mission concrète d'évaluation lors de laquelle aura lieu la supervision (optionnel). */
    private Long requestId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SupervisionPlanStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Référence vers la fiche FOR 21-3 ou FOR 65-1/65-6 produite. */
    private Long supervisionSheetId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = SupervisionPlanStatus.PLANNED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
