package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "complementary_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplementaryEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team; // Généralement même équipe

    @Column(nullable = false, unique = true)
    private String evaluationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplementaryEvaluationStatus status;

    // Devis pour l'évaluation complémentaire
    private BigDecimal quotationAmount;
    private Boolean quotationApprovedByDAG;
    private LocalDateTime quotationSentToOEC;
    private Boolean quotationAcceptedByOEC;
    private LocalDateTime quotationPaidDate;

    // Plan spécifique (focus écarts critiques)
    @Column(columnDefinition = "TEXT")
    private String evaluationPlan;
    private Boolean planValidatedByRA;
    private LocalDateTime planSentToOEC;

    // Ordres de mission
    private Boolean missionOrdersIssued;
    private LocalDateTime missionOrdersDate;

    // Évaluation elle-même
    private LocalDateTime evaluationDate;
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings; // Résultats vérification in situ
    @Column(columnDefinition = "TEXT")
    private String evidenceExamined; // Preuves examinées
    @Column(columnDefinition = "TEXT")
    private String actionEffectivenessAssessment; // Efficacité des actions

    // Rapport d'évaluation complémentaire
    @Column(columnDefinition = "TEXT")
    private String reportContent;
    private LocalDateTime reportDraftedDate; // Délai: 15 jours max
    private Boolean reportSentToCDRA;
    private LocalDateTime reportSentDate;

    // Résultat
    private Boolean criticalGapsResolved; // Écarts critiques soldés ?
    @Column(columnDefinition = "TEXT")
    private String unresolvableGapsDetails; // Détails si non soldés

    @ManyToOne
    @JoinColumn(name = "decided_by_cd_id")
    private User decidedByCD; // CD qui a décidé l'évaluation complémentaire

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = ComplementaryEvaluationStatus.DECIDED;
    }
}
