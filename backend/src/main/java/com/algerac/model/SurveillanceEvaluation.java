package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "surveillance_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveillanceEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "certificate_id", nullable = false)
    private AccreditationCertificate certificate;

    @ManyToOne
    @JoinColumn(name = "surveillance_plan_id")
    private SurveillancePlan surveillancePlan;

    @ManyToOne
    @JoinColumn(name = "risk_analysis_id")
    private RiskAnalysisForm riskAnalysis;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;

    @Column(nullable = false, unique = true)
    private String evaluationCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SurveillanceEvaluationStatus status;

    // Devis surveillance
    private BigDecimal quotationAmount;
    private Boolean quotationAcceptedByOEC;
    private LocalDateTime quotationAcceptedDate;

    // Préparation
    private Boolean confidentialityAgreementsSigned;
    private Boolean teamCompositionSentToOEC;
    private LocalDateTime teamValidationDeadline; // 3 jours
    private Boolean teamValidatedByOEC;

    // Plan d'évaluation surveillance
    @Column(columnDefinition = "TEXT")
    private String evaluationPlan;
    @Column(columnDefinition = "TEXT")
    private String focusScope; // Portée échantillonnée (PRO 13)
    @Column(columnDefinition = "TEXT")
    private String previousActionPlansVerification;
    @Column(columnDefinition = "TEXT")
    private String changesExamination; // Examen changements FOR 77-1
    private Boolean planValidatedByCD;
    private LocalDateTime planSentToOEC; // Min 5 jours avant

    // Ordres de mission
    private Boolean missionOrdersApprovedByDTDG;
    private Boolean missionOrdersSentToTeam;

    // Évaluation jour J
    private LocalDateTime evaluationDate;
    private Boolean openingMeetingDone;
    private Boolean evaluationDone;
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;
    private Boolean teamConsensusDone;
    private Boolean closingMeetingDone;

    // Écarts surveillance
    private Integer newGapsCount;
    private Boolean hasNewGaps;

    // Rapport
    @Column(columnDefinition = "TEXT")
    private String reportContent;
    private LocalDateTime reportDraftedDate; // 30 jours
    private Boolean reportValidatedByCDDT; // 15 jours
    private LocalDateTime reportValidationDate;

    // Dossier CAS
    private Boolean dossierPreparedForCAS;
    @Column(columnDefinition = "TEXT")
    private String casRecommendation; // Recommandation pour le CAS

    // Documents requis FOR 68
    private Boolean documentsRequestSent; // FOR 68 envoyé (2 mois avant per PRO 25)
    private Boolean documentsReceivedFromOEC;
    private LocalDateTime documentsReceivedDate;

    // Type d'évaluation (PRO 25 §5.2): SURVEILLANCE, EXTENSION, RENOUVELLEMENT, EXTRAORDINAIRE
    @Column(length = 30)
    private String evaluationType;

    // Extension (§5.2.2)
    @Column(length = 50)
    private String extensionType; // SAME_TYPE, OTHER_TYPE, OTHER_SITE
    private Integer findingDeadlineMonths; // 6 mois pour extension, 3 pour surveillance

    // Surveillance extraordinaire (§5.2.1)
    @Column(columnDefinition = "TEXT")
    private String extraordinaryReason; // COMPLAINT, REORGANIZATION, TRANSFER

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = SurveillanceEvaluationStatus.PLANNED;
    }
}
