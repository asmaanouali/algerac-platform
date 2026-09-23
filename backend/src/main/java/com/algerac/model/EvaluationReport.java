package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;
    
    @Column(nullable = false, unique = true)
    private String reportNumber;
    
    @Enumerated(EnumType.STRING)
    private ReportType type; // FOR_08_INSPECTION, FOR_09_LABORATORY, FOR_09_1_BIOMEDICAL, FOR_10_CERTIFICATION
    
    @Column(columnDefinition = "TEXT")
    private String contextAndObjectives;
    
    @Column(columnDefinition = "TEXT")
    private String teamComposition;
    
    @Column(columnDefinition = "TEXT")
    private String programRealized;
    
    @Column(columnDefinition = "TEXT")
    private String findingsByRequirement; // Constats par exigence
    
    @Column(columnDefinition = "TEXT")
    private String gapsSummary; // Synthèse des écarts
    
    @Column(columnDefinition = "TEXT")
    private String gapsStatus; // État traitement écarts
    
    @Column(columnDefinition = "TEXT")
    private String strengths; // Points forts identifiés
    
    @Column(columnDefinition = "TEXT")
    private String improvementAreas; // Axes d'amélioration
    
    @Column(columnDefinition = "TEXT")
    private String conclusionAndRecommendation;
    
    @Column(columnDefinition = "TEXT")
    private String annexes; // FOR 02, preuves, etc.
    
    private LocalDateTime evaluationClosureDate;
    
    private LocalDateTime draftedByREE; // Rédigé par REE (délai: 30 jours après clôture)
    
    /** Étape 1 du circuit v2 : REE soumet au RA. */
    private LocalDateTime submittedToRA;

    /** Le RA a relu et transmis au CD pour validation. */
    private Boolean validatedByRA;
    private LocalDateTime raValidationDate;

    @Column(columnDefinition = "TEXT")
    private String raComments;

    private LocalDateTime submittedToCD;
    
    private Boolean validatedByCD;
    
    private Boolean validatedByDT; // Si CD = REE, DT valide
    
    private LocalDateTime validationDate;
    
    @Column(columnDefinition = "TEXT")
    private String correctionRequests; // Demandes de correction
    
    @Column(columnDefinition = "TEXT")
    private String FOR23AppreciationSheet; // FOR 23 remplie par CD
    
    private LocalDateTime sentToDeptConsolidation;

    /** Consolidation : facture émise + rapport+facture envoyés à l'OEC. */
    private Boolean consolidationCompleted;
    private LocalDateTime consolidationCompletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consolidation_user_id")
    private User consolidationUser;

    /** Rapport + facture envoyés à l'OEC. */
    private LocalDateTime sentToOEC;
    
    @Enumerated(EnumType.STRING)
    private EvaluationReportStatus status;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = EvaluationReportStatus.DRAFT;
        }
    }
}
