package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "qualifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Qualification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    // Type de rôle qualifié : RE, ET, EXP
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamRole qualifiedRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QualificationStatus status;

    // Normes qualifiées (JSON array: ["17025","17020","15189","17065","17021-1","17024"])
    @Column(columnDefinition = "TEXT")
    private String qualifiedStandardsJson;

    // Domaines et sous-domaines techniques qualifiés (JSON array of {category, domain, subDomain})
    @Column(columnDefinition = "TEXT")
    private String qualifiedDomainsJson;

    // Formation initiale
    private Double trainingExamScore;       // Note de l'examen (≥70% pour réussir)
    private LocalDate trainingCompletedDate;
    private String trainingSessionId;        // Référence de la session de formation

    // Phases de qualification
    private Integer observerMissionsCompleted;    // Nombre de missions en tant qu'observateur (min 1)
    private Integer supervisedMissionsCompleted;  // Nombre de missions sous supervision (min 2)

    // Dates de qualification
    private LocalDate qualificationDate;     // Date de la décision de qualification
    private LocalDate expiryDate;            // Date d'expiration (qualificationDate + 3 ans)
    private LocalDate lastRenewalDate;       // Dernière date de renouvellement

    // Décision de la Commission de Qualification
    @Enumerated(EnumType.STRING)
    private QualificationDecisionType lastDecisionType;
    private LocalDate lastDecisionDate;
    @Column(columnDefinition = "TEXT")
    private String lastDecisionNotes;

    // Référence à la commission ayant pris la décision
    @ManyToOne
    @JoinColumn(name = "commission_id")
    private QualificationCommission commission;

    // Surveillance
    private Integer missionsCompletedCurrentCycle;  // Missions effectuées dans le cycle en cours
    private LocalDate lastObservationDate;          // Dernière observation sur site
    private LocalDate lastRecyclingDate;            // Dernière participation journée de recyclage
    private Integer recyclingParticipations;         // Nombre de participations aux journées

    // Contrat de collaboration FOR 18 bis
    private Boolean collaborationContractSigned;
    private LocalDate collaborationContractDate;

    // Carte de qualification
    private String qualificationCardNumber;

    // Suspension / Retrait
    private LocalDate suspensionDate;
    @Column(columnDefinition = "TEXT")
    private String suspensionReason;
    private LocalDate withdrawalDate;
    @Column(columnDefinition = "TEXT")
    private String withdrawalReason;

    // Cas particulier: provenant d'un autre organisme d'accréditation
    private Boolean fromOtherAccreditationBody;
    private String sourceAccreditationBody;
    private Boolean lightProcessApplied;

    // Type d'emploi : différencie cycle 3 ans (EXTERNAL) vs 6 ans (PERMANENT) — PRO 06 §5.3
    @Column(length = 20)
    private String employmentType; // "EXTERNAL" | "PERMANENT"

    // Suivi d'inactivité — PRO 06 §5.5 : période d'inactivité ≥ 1 an déclenche requalification
    private LocalDate lastActivityDate;
    private LocalDate inactivityNoticeDate;
    private Boolean requalificationRequired;

    // PRO 06 §5.3 — étape 2 : évaluation partielle satisfaisante (limitée à une reprise)
    private Boolean partialAssessmentCompleted;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = QualificationStatus.PENDING_TRAINING;
        if (observerMissionsCompleted == null) observerMissionsCompleted = 0;
        if (supervisedMissionsCompleted == null) supervisedMissionsCompleted = 0;
        if (missionsCompletedCurrentCycle == null) missionsCompletedCurrentCycle = 0;
        if (recyclingParticipations == null) recyclingParticipations = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
