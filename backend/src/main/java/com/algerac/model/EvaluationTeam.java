package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evaluation_teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationTeam {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false, unique = true)
    private String teamCode; // Code unique de l'équipe
    
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TeamMember> members = new ArrayList<>();
    
    @Column(columnDefinition = "TEXT")
    private String compositionSheetFOR26; // FOR 26
    
    private LocalDateTime sentToOEC; // Date d'envoi de la composition à l'OEC
    
    private LocalDateTime oecResponseDeadline; // Délai de réponse OEC (3 jours)
    
    private LocalDate proposedEvaluationDate; // Date d'évaluation proposée par RA
    
    private LocalDate oecProposedDate; // Date alternative proposée par l'OEC (si refus)
    
    private Boolean evaluationDateAccepted; // OEC a accepté la date proposée
    
    @Column(columnDefinition = "TEXT")
    private String dateRefusalReason; // Motif du refus de date par l'OEC
    
    private Boolean oecValidated; // OEC a validé la composition
    
    private Boolean hasRecusation; // OEC a récusé un ou plusieurs membres
    
    @Column(columnDefinition = "TEXT")
    private String recusationReason; // Motif de récusation
    
    private LocalDateTime recusationDate;
    
    @Enumerated(EnumType.STRING)
    private RecusationDecision recusationDecision; // ACCEPTED, REJECTED
    
    @Column(columnDefinition = "TEXT")
    private String recusationDecisionReason;
    
    private LocalDateTime finalValidationDate;
    
    @Enumerated(EnumType.STRING)
    private TeamStatus status;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = TeamStatus.DRAFT;
        }
    }
}
