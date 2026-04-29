package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * FOR 21-3 — Fiche de supervision d'un expert (PRO 06 §5.5).
 * Remplie par REE / ET à chaque intervention de l'expert.
 */
@Entity
@Table(name = "expert_supervision_sheets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpertSupervisionSheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert;

    @ManyToOne
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor; // REE ou ET qui remplit la fiche

    private Long requestId;            // Mission d'évaluation concernée
    private LocalDate interventionDate;

    // Scores 1-5
    private Integer scoreTechnicalMastery;
    private Integer scoreObservationMethod;
    private Integer scoreFindings;
    private Integer scoreReportWriting;
    private Integer scoreCommunication;
    private Integer scoreImpartiality;
    private Integer scoreDiplomacy;

    private Double scoreGlobal;

    @Column(length = 30)
    private String verdict; // FAVORABLE / FAVORABLE_RESERVE / DEFAVORABLE

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
