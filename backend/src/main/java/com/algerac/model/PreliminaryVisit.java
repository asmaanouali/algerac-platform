package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "preliminary_visits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreliminaryVisit {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false)
    private Boolean proposedByCD; // Proposée par le CD
    
    private Boolean acceptedByOEC; // Acceptée par l'OEC
    
    private LocalDateTime proposalDate; // Date de proposition
    
    private LocalDateTime responseDate; // Date de réponse OEC
    
    private LocalDateTime visitDate; // Date programmée de la visite
    
    @Column(columnDefinition = "TEXT")
    private String reportFOR12; // Rapport de visite (FOR 12)
    
    private Integer estimatedEvaluationDuration; // Durée estimée en jours
    
    @Column(columnDefinition = "TEXT")
    private String obstaclesIdentified; // Obstacles identifiés
    
    private Boolean hasBlockingElements; // Éléments bloquants identifiés
    
    @Column(columnDefinition = "TEXT")
    private String requiredCompetencies; // Compétences requises identifiées
    
    private LocalDateTime reportSubmissionDate; // Date de transmission du rapport
    
    private Boolean processSuspended; // Processus suspendu en attente de levée d'obstacles
    
    private LocalDateTime obstaclesLiftedDate; // Date de levée des obstacles
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
