package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cas_votes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CASVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meeting_id", nullable = false)
    private CASMeeting meeting;

    @ManyToOne
    @JoinColumn(name = "voter_id", nullable = false)
    private User voter;

    @Column(nullable = false)
    private String vote; // ACCORDER, REFUSER, AJOURNER, ABSTENTION

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Boolean attendanceConfirmed;

    // FOR 14 - Avis des membres CAS (PRO 07)
    @Column(columnDefinition = "TEXT")
    private String for14Opinion;

    @Column(columnDefinition = "TEXT")
    private String for14TechnicalRemarks;

    @Column(columnDefinition = "TEXT")
    private String for14ScopeRemarks;

    @Column(columnDefinition = "TEXT")
    private String for14Recommendation;

    private String for14ConformityAssessment; // CONFORME, CONFORME_RESERVATIONS, NON_CONFORME_MAJEUR, INSUFFISANT

    private String for14CompetenceAssessment; // ADEQUATE, PARTIELLE, INSUFFISANTE

    private String for14ImpartialityAssessment; // SATISFAISANTE, RISQUES_IDENTIFIES, NON_SATISFAISANTE

    // Conflict of interest declaration (PRO 07 §4.2)
    private Boolean hasConflictOfInterest;

    @Column(columnDefinition = "TEXT")
    private String conflictDescription;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (attendanceConfirmed == null) attendanceConfirmed = false;
    }

    public Long getMeetingId() { return meeting != null ? meeting.getId() : null; }
    public Long getVoterId() { return voter != null ? voter.getId() : null; }
    public String getVoterName() { return voter != null ? voter.getFullName() : null; }
}
