package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    @JsonIgnore
    private EvaluationTeam team;
    
    @ManyToOne
    @JoinColumn(name = "expert_id", nullable = false)
    private User expert; // Lien vers l'expert/évaluateur
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TeamRole role; // REE, ET, EXP, EQ, SUP, OBS, EF
    
    @Column(columnDefinition = "TEXT")
    private String specialization; // Spécialisation/domaine de compétence
    
    private Boolean confidentialityAgreementSigned; // FOR 01-1 signé
    
    private Boolean impartialityAgreementSigned; // FOR 01-1 signé
    
    private Boolean conflictOfInterestDeclared;
    
    @Column(columnDefinition = "TEXT")
    private String conflictOfInterestDetails;
    
    private Boolean available;
    
    private Boolean recusedByOEC; // Récusé par l'OEC
    
    @Column(columnDefinition = "TEXT")
    private String recusationReason;
    
    private LocalDateTime addedAt;
    
    @PrePersist
    protected void onCreate() {
        if (addedAt == null) {
            addedAt = LocalDateTime.now();
        }
    }
    
    @JsonProperty("commitmentSigned")
    public Boolean getCommitmentSigned() {
        return Boolean.TRUE.equals(confidentialityAgreementSigned) && 
               Boolean.TRUE.equals(impartialityAgreementSigned);
    }
    
    @JsonProperty("teamId")
    public Long getTeamId() {
        return team != null ? team.getId() : null;
    }
}
