package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionPlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "gap_id", nullable = false)
    private Gap gap;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String correctiveActions; // Actions correctives
    
    @Column(columnDefinition = "TEXT")
    private String preventiveActions; // Actions préventives
    
    @Column(columnDefinition = "TEXT")
    private String responsiblePerson; // Responsable désigné
    
    private LocalDateTime implementationDeadline; // Délai de mise en œuvre
    
    @Column(columnDefinition = "TEXT")
    private String supportingDocuments; // Documents/preuves support
    
    private LocalDateTime submittedByOEC; // Date de soumission par OEC
    
    private Boolean submittedInTime; // Soumis dans les délais (10 jours)
    
    private LocalDateTime evaluatedByTeam; // Date d'évaluation par l'équipe
    
    private Boolean acceptedByTeam; // Plan accepté par l'équipe
    
    @Column(columnDefinition = "TEXT")
    private String teamFeedback; // Retour de l'équipe
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Motif de rejet si refusé
    
    private LocalDateTime implementationCompletedDate;
    
    @Column(columnDefinition = "TEXT")
    private String implementationEvidence; // Preuves de mise en œuvre
    
    private Boolean evidenceSatisfactory;
    
    @Enumerated(EnumType.STRING)
    private ActionPlanStatus status;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ActionPlanStatus.PENDING;
        }
    }
}
