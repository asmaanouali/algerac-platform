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
    private String meetingMinutes; // PV de la réunion

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
}
