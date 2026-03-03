package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
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

    // Mandatement
    private LocalDateTime mandatementSentAt;

    @Column(columnDefinition = "TEXT")
    private String mandatementMessage;
    
    // Résultats individuels de la revue documentaire
    @Column(columnDefinition = "TEXT")
    private String docReviewResults;          // Résultats individuels du membre

    @Column(columnDefinition = "TEXT")
    private String docReviewDeficiencies;     // Manquements identifiés par ce membre

    private LocalDateTime docReviewSubmittedAt; // Date de soumission des résultats

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

    @JsonProperty("requestId")
    public Long getRequestId() {
        return team != null && team.getRequest() != null ? team.getRequest().getId() : null;
    }

    @JsonProperty("requestReferenceNumber")
    public String getRequestReferenceNumber() {
        return team != null && team.getRequest() != null ? team.getRequest().getReferenceNumber() : null;
    }

    @JsonProperty("proposedEvaluationDate")
    public LocalDate getProposedEvaluationDate() {
        return team != null ? team.getProposedEvaluationDate() : null;
    }

    @JsonProperty("evaluationDateAccepted")
    public Boolean getEvaluationDateAccepted() {
        return team != null ? team.getEvaluationDateAccepted() : null;
    }

    @JsonProperty("oecProposedDate")
    public LocalDate getOecProposedDate() {
        return team != null ? team.getOecProposedDate() : null;
    }

    @JsonProperty("dossierUnlocked")
    public Boolean getDossierUnlocked() {
        // Always allow viewing — the dossier is in read-only mode until eval date
        return true;
    }

    @JsonProperty("dossierWritable")
    public Boolean getDossierWritable() {
        if (team == null || team.getProposedEvaluationDate() == null) return false;
        LocalDate evalDate = Boolean.TRUE.equals(team.getEvaluationDateAccepted()) 
                ? team.getProposedEvaluationDate()
                : (team.getOecProposedDate() != null ? team.getOecProposedDate() : team.getProposedEvaluationDate());
        return !LocalDate.now().isBefore(evalDate);
    }

    @JsonProperty("requestStatus")
    public String getRequestStatus() {
        return team != null && team.getRequest() != null ? team.getRequest().getStatus().name() : null;
    }
}
