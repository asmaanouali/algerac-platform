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
    
    // Phase frais
    private Long paymentId;                   // Référence au paiement associé
    
    private LocalDateTime documentationSentToTeam;
    
    private LocalDateTime reviewStartDate;
    
    private LocalDateTime reviewCompletionDate; // Délai: 15 jours max
    
    private LocalDateTime teamResultsDeadline;  // Date limite résultats (15j)
    
    @Column(columnDefinition = "TEXT")
    private String technicalReviewFOR56; // FOR 56 ou FOR 56-1
    
    @Column(columnDefinition = "TEXT")
    private String qualityReviewFOR56;
    
    private Boolean deficienciesIdentified; // Manquements identifiés
    
    @Column(columnDefinition = "TEXT")
    private String deficienciesDetails;
    
    // Phase résultats équipe → CD → OEC
    @Column(columnDefinition = "TEXT")
    private String teamResults;              // Résultats consolidés de l'équipe
    
    private LocalDateTime resultsSentToCd;   // Date envoi résultats au CD
    
    @Column(columnDefinition = "TEXT")
    private String cdSynthesis;              // Synthèse rédigée par le CD
    
    private Boolean cdSentAsIs;              // CD a envoyé résultats tels quels
    
    private LocalDateTime resultsSentToOEC;
    
    private LocalDateTime oecResponseDeadline; // 3 mois pour répondre
    
    private Boolean oecRespondedInTime;
    
    @Column(columnDefinition = "TEXT")
    private String oecResponse;
    
    @Column(columnDefinition = "TEXT")
    private String oecDecision;              // CONTINUE ou CORRECT
    
    private LocalDateTime oecCorrectionDeadline; // Délai correction OEC (3 mois max)
    
    private Boolean responseAccepted; // Réponse satisfaisante
    
    @Column(columnDefinition = "TEXT")
    private String cdFinalDecision;          // CONTINUE ou STOP
    
    @Column(columnDefinition = "TEXT")
    private String cdDecisionComments;       // Commentaires du CD
    
    @Column(columnDefinition = "TEXT")
    private String cdDecisionIfNotSatisfactory; // Legacy
    
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
    
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
}
