package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_29 : Évaluation à distance.
 * Gère les évaluations réalisées par des moyens de communication à distance.
 */
@Entity
@Table(name = "remote_evaluations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RemoteEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @Column(nullable = false, unique = true)
    private String evaluationCode;

    // ═══════════════════════════════════════════════════════════
    // §5.2 — Justification
    // ═══════════════════════════════════════════════════════════
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemoteEvalJustification justification;

    @Column(columnDefinition = "TEXT")
    private String justificationDetails;

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Analyse des risques (FOR 77-1)
    // ═══════════════════════════════════════════════════════════
    @ManyToOne
    @JoinColumn(name = "risk_analyzed_by_id")
    private User riskAnalyzedBy;

    private LocalDateTime riskAnalysisDate;

    @Column(columnDefinition = "TEXT")
    private String riskAnalysisComments;

    // 11 critères d'analyse des risques (§5.3)
    private Integer monthsSinceLastOnsiteAssessment;
    private Boolean ictEquipmentAvailable;             // Disponibilité TIC
    @Column(columnDefinition = "TEXT")
    private String ictEquipmentDetails;
    private Boolean requirementsNatureSuitable;        // Nature des exigences compatible
    private Boolean findingsNatureFollowable;          // Nature des constatations évaluable
    @Column(columnDefinition = "TEXT")
    private String findingsDetails;
    private Boolean complaintsToInvestigate;           // Réclamations à enquêter
    @Column(columnDefinition = "TEXT")
    private String complaintsDetails;
    private Boolean safetyConstraintsAcceptable;       // Sûreté/sécurité OEC OK
    private Boolean cabResourcesStable;                // Stabilité ressources OEC
    private Boolean digitizationLevelAdequate;         // Numérisation suffisante
    private Boolean cabPerformanceSatisfactory;        // Performance/transparence OEC
    private Boolean teamSizeAdequate;                  // Taille équipe & durée adéquates
    private Boolean assessorRemoteExperience;          // Expérience évaluateurs distance

    @Enumerated(EnumType.STRING)
    private RiskAnalysisResult riskAnalysisResult;     // ACCEPTABLE / NOT_ACCEPTABLE

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Configuration technique
    // ═══════════════════════════════════════════════════════════
    @Column(nullable = false)
    private String technologyPlatform;

    private Boolean videoCapabilityVerified;
    private Boolean audioCapabilityVerified;
    private Boolean documentSharingVerified;
    private Boolean connectionStabilityTest;

    @Column(columnDefinition = "TEXT")
    private String technicalPrerequisites;

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Portée
    // ═══════════════════════════════════════════════════════════
    @Column(columnDefinition = "TEXT")
    private String remoteScope;
    @Column(columnDefinition = "TEXT")
    private String onsiteScope;
    private Boolean partialRemote;

    // ═══════════════════════════════════════════════════════════
    // §5.4 — Planification
    // ═══════════════════════════════════════════════════════════
    private LocalDateTime scheduledStartDate;
    private LocalDateTime scheduledEndDate;
    private Integer estimatedDurationHours;
    private Integer evaluationPhases;                  // 1 ou 2 (§5.6 : 2 x ½ journée)

    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;

    // ═══════════════════════════════════════════════════════════
    // §5.3 — Confidentialité (FOR 01-1)
    // ═══════════════════════════════════════════════════════════
    private Boolean confidentialityConfirmed;
    private LocalDateTime confidentialityConfirmationDate;

    // ═══════════════════════════════════════════════════════════
    // §5.6 — Déroulement de l'évaluation
    // ═══════════════════════════════════════════════════════════
    private LocalDateTime openingMeetingDate;
    private LocalDateTime closingMeetingDate;

    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;

    private Boolean technicalDifficultiesEncountered;
    @Column(columnDefinition = "TEXT")
    private String technicalDifficultiesDetails;

    // §5.6-C — Fiches d'écarts (24h max après clôture)
    private LocalDateTime deviationSheetsSentDate;
    private LocalDateTime deviationSheetsDeadline;
    // Documents validés par l'OEC (24h max après réception)
    private LocalDateTime oecDocumentsReceivedDate;
    private LocalDateTime oecDocumentsDeadline;

    // §5.6-D — Traçabilité documentaire
    @Column(columnDefinition = "TEXT")
    private String ictUsageDescription;
    @Column(columnDefinition = "TEXT")
    private String ictEffectivenessAssessment;

    // §5.6 — Suivi sur site
    private Boolean onsiteFollowUpNeeded;
    @Column(columnDefinition = "TEXT")
    private String onsiteFollowUpReason;

    // ═══════════════════════════════════════════════════════════
    // §5.7 — Non réalisable : revue documentaire + conférence
    // ═══════════════════════════════════════════════════════════
    private Boolean remoteNotFeasible;
    @Column(columnDefinition = "TEXT")
    private String notFeasibleReason;
    private Boolean deskReviewConducted;
    private Boolean conferenceCallConducted;
    private LocalDateTime onsitePlannedDate;

    // ═══════════════════════════════════════════════════════════
    // Statut & Approbations
    // ═══════════════════════════════════════════════════════════
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemoteEvalStatus status;

    @ManyToOne
    @JoinColumn(name = "approved_by_cd_id")
    private User approvedByCd;

    private LocalDateTime approvalDate;
    @Column(columnDefinition = "TEXT")
    private String approvalComments;

    private Boolean oecConsentObtained;
    private LocalDateTime oecConsentDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = RemoteEvalStatus.RISK_ANALYSIS_PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
