package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cas_meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CASMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    /** PRO 07 §5.1 — The specialized committee assigned to examine this dossier. */
    @ManyToOne
    @JoinColumn(name = "committee_id")
    private CASCommittee committee;

    @Column(nullable = false, unique = true)
    private String meetingCode;

    private LocalDateTime meetingDate;
    private String location;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String dossierSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CASMeetingStatus status;

    @Column(columnDefinition = "TEXT")
    private String finalDecision;

    @Column(columnDefinition = "TEXT")
    private String presidentNotes;

    // PRO 07 - Convocation & quorum fields
    private LocalDateTime summonsSentAt;
    private LocalDateTime dossierSentAt;
    private Integer quorumRequired;
    private Integer attendeesConfirmed;
    private Boolean quorumReached;

    // ─── Dossier en lecture seule (PRO 07) ────────────────────────────
    /**
     * Le dossier transmis aux membres du CAS doit être consultable en ligne
     * mais NI téléchargeable NI modifiable. Vrai par défaut.
     */
    @Builder.Default
    @Column(nullable = false)
    private Boolean dossierReadOnly = Boolean.TRUE;

    /** Téléchargement explicitement désactivé (sécurité front + back). */
    @Builder.Default
    @Column(nullable = false)
    private Boolean dossierDownloadDisabled = Boolean.TRUE;
    // ──────────────────────────────────────────────────────────────────

    // ─── Expert optionnel (5 membres + éventuellement 1 expert) ───────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "optional_expert_id")
    private User optionalExpert;

    @Column(columnDefinition = "TEXT")
    private String optionalExpertJustification; // Pourquoi un expert est ajouté
    // ──────────────────────────────────────────────────────────────────

    // PRO 16 - Decision details (FOR 15)
    @Column(columnDefinition = "TEXT")
    private String for15DecisionJustification;

    @Column(columnDefinition = "TEXT")
    private String for15Conditions;

    @Column(columnDefinition = "TEXT")
    private String for15ScopeDecision;

    @Column(columnDefinition = "TEXT")
    private String for15ReservesToLift;

    private LocalDateTime for15ReservesDeadline;

    @Column(columnDefinition = "TEXT")
    private String for15AppealRightsNotice;

    @Column(columnDefinition = "TEXT")
    private String meetingMinutes; // FOR 42 — PV de la réunion

    /** FOR 42 — President signed the minutes. */
    private LocalDateTime minutesSignedAt;

    /** FOR 42 — Minutes distributed to all members present. */
    private LocalDateTime minutesDistributedAt;

    private LocalDateTime votingOpenedAt;
    private LocalDateTime votingClosedAt;
    private LocalDateTime decidedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = CASMeetingStatus.PLANNED;
    }

    public Long getRequestId() { return request != null ? request.getId() : null; }

    public Long getCommitteeId() { return committee != null ? committee.getId() : null; }

    public String getCommitteeName() { return committee != null ? committee.getName() : null; }
}
