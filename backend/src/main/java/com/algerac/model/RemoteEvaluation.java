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

    // Justification de l'évaluation à distance
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemoteEvalJustification justification;

    @Column(columnDefinition = "TEXT")
    private String justificationDetails;

    // Configuration technique
    @Column(nullable = false)
    private String technologyPlatform;       // Plateforme utilisée (Zoom, Teams, etc.)

    private Boolean videoCapabilityVerified;  // Capacité vidéo vérifiée ?
    private Boolean audioCapabilityVerified;  // Capacité audio vérifiée ?
    private Boolean documentSharingVerified;  // Partage de documents vérifié ?
    private Boolean connectionStabilityTest; // Test de stabilité de connexion effectué ?

    @Column(columnDefinition = "TEXT")
    private String technicalPrerequisites;    // Prérequis techniques détaillés

    // Portée de l'évaluation à distance
    @Column(columnDefinition = "TEXT")
    private String remoteScope;              // Ce qui peut être évalué à distance
    @Column(columnDefinition = "TEXT")
    private String onsiteScope;              // Ce qui nécessite une évaluation sur site

    private Boolean partialRemote;           // Évaluation partiellement à distance ?

    // Planning
    private LocalDateTime scheduledStartDate;
    private LocalDateTime scheduledEndDate;
    private Integer estimatedDurationHours;

    // Équipe d'évaluation
    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;

    // Résultats
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;

    private Boolean technicalDifficultiesEncountered;
    @Column(columnDefinition = "TEXT")
    private String technicalDifficultiesDetails;

    private Boolean onsiteFollowUpNeeded;
    @Column(columnDefinition = "TEXT")
    private String onsiteFollowUpReason;

    // Statut
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RemoteEvalStatus status;

    // Approbations
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
        if (status == null) status = RemoteEvalStatus.PROPOSED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
