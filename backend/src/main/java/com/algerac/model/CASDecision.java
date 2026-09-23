package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cas_decisions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CASDecision {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private EvaluationReport report;
    
    @Column(nullable = false, unique = true)
    private String decisionNumber;
    
    @Enumerated(EnumType.STRING)
    private CASDecisionType decisionType;
    
    private LocalDateTime meetingDate;
    
    @Column(columnDefinition = "TEXT")
    private String justification;
    
    @Column(columnDefinition = "TEXT")
    private String scope; // Portée accordée/réduite
    
    @Column(columnDefinition = "TEXT")
    private String conditions; // Conditions éventuelles
    
    @Column(columnDefinition = "TEXT")
    private String reservesToLift; // Réserves à lever (avec date limite)
    
    private LocalDateTime reservesDeadline;
    
    @Column(columnDefinition = "TEXT")
    private String additionalRequirements; // Compléments requis si ajournement
    
    private LocalDateTime nextPresentationDate; // Date nouvelle présentation si ajournement
    
    @Column(columnDefinition = "TEXT")
    private String refusalReason; // Motif de refus
    
    private Boolean appealRightNotified; // Droit de recours notifié
    
    @Column(columnDefinition = "TEXT")
    private String minutesAndJustifications; // PV de la réunion
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
