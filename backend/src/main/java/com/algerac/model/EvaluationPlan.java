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
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String planFOR32; // Contenu du plan FOR 32
    
    @Column(columnDefinition = "TEXT")
    private String dailyProgram; // Programme par jour/site
    
    @Column(columnDefinition = "TEXT")
    private String activityDistribution; // Répartition des activités entre évaluateurs
    
    @Column(columnDefinition = "TEXT")
    private String schedules; // Horaires
    
    @Column(columnDefinition = "TEXT")
    private String documentsToExamine; // Documents à examiner sur site
    
    private LocalDateTime createdByREE;
    
    private Boolean validatedByCD;
    
    private LocalDateTime cdValidationDate;
    
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
