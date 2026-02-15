package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documentary_reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentaryReview {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @ManyToOne
    @JoinColumn(name = "team_id")
    private EvaluationTeam team;
    
    private LocalDateTime documentationSentToTeam;
    
    private LocalDateTime reviewStartDate;
    
    private LocalDateTime reviewCompletionDate; // Délai: 15 jours max
    
    @Column(columnDefinition = "TEXT")
    private String technicalReviewFOR56; // FOR 56 ou FOR 56-1
    
    @Column(columnDefinition = "TEXT")
    private String qualityReviewFOR56;
    
    private Boolean deficienciesIdentified; // Manquements identifiés
    
    @Column(columnDefinition = "TEXT")
    private String deficienciesDetails;
    
    private LocalDateTime resultsSentToOEC;
    
    private LocalDateTime oecResponseDeadline; // 3 mois pour répondre
    
    private Boolean oecRespondedInTime;
    
    @Column(columnDefinition = "TEXT")
    private String oecResponse;
    
    private Boolean responseAccepted; // Réponse satisfaisante
    
    @Column(columnDefinition = "TEXT")
    private String cdDecisionIfNotSatisfactory; // CLASSER ou POURSUIVRE
    
    @Enumerated(EnumType.STRING)
    private DocumentaryReviewStatus status;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = DocumentaryReviewStatus.PENDING;
        }
    }
}
