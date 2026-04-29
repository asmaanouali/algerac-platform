package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;
    
    @Column(nullable = false, unique = true)
    private String planCode; // Code unique du plan
    
    @Column(columnDefinition = "TEXT")
    private String planFOR32; // Contenu du plan FOR 32
    
    @Column(columnDefinition = "TEXT")
    private String dailyProgram; // Programme par jour/site
    
    @Column(columnDefinition = "TEXT")
    private String activityDistribution; // Répartition des activités entre évaluateurs
    
    @Column(columnDefinition = "TEXT")
    private String schedules; // Horaires
    
    @Column(columnDefinition = "TEXT")
    private String documentsToExamine; // Documents à examiner sur site

    /** PRO 26 §5.3.2-a : JSON des IDs de sites satellites planifiés pour cette évaluation. */
    @Column(columnDefinition = "TEXT")
    private String sitesToEvaluateJson;

    /** PRO 26 §5.3.2-a : à l'initiale, tous les sites doivent être évalués. */
    private Boolean multisiteAllSitesRequired;

    /** PRO 26 §5.3.2-b : temps de déplacement total estimé entre sites (en heures). */
    private Integer travelTimeHours;

    private LocalDateTime createdByREE;
    
    /**
     * Routing FOR 32 :
     *  - REE INTERNE à ALGERAC  → validation par DT
     *  - REE EXTERNE à ALGERAC  → validation par CD
     * Cette colonne est renseignée à la création du plan d'après le profil de l'REE.
     */
    private Boolean reeIsExternal;

    private Boolean validatedByCD;
    
    private LocalDateTime cdValidationDate;

    /** Validation par DT lorsque le REE est interne à ALGERAC. */
    private Boolean validatedByDT;

    private LocalDateTime dtValidationDate;
    
    @Column(columnDefinition = "TEXT")
    private String cdAdjustmentRequests; // Demandes d'ajustements par CD
    
    private LocalDateTime sentToOEC;
    
    private LocalDateTime evaluationDate; // Date prévue de l'évaluation
    
    @Enumerated(EnumType.STRING)
    private EvaluationPlanStatus status;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = EvaluationPlanStatus.DRAFT;
        }
    }
}
