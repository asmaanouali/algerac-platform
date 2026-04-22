package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * FOR 58 — Convocation individuelle d'un membre CAS (PRO 07 §5.10).
 * Tracks that each committee member was formally notified of the meeting
 * at least 5 days before the date.
 */
@Entity
@Table(name = "for58_convocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FOR58Convocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meeting_id", nullable = false)
    private CASMeeting meeting;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    private LocalDateTime sentAt;

    private Boolean acknowledged;
    private LocalDateTime acknowledgedAt;

    @Column(columnDefinition = "TEXT")
    private String convocationText;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) sentAt = LocalDateTime.now();
        if (acknowledged == null) acknowledged = false;
    }

    @JsonProperty("memberId")
    public Long getMemberId() {
        return member != null ? member.getId() : null;
    }

    @JsonProperty("memberName")
    public String getMemberName() {
        return member != null ? member.getFullName() : null;
    }

    @JsonProperty("memberEmail")
    public String getMemberEmail() {
        return member != null ? member.getEmail() : null;
    }

    @JsonProperty("meetingId")
    public Long getMeetingId() {
        return meeting != null ? meeting.getId() : null;
    }

    @JsonProperty("meetingCode")
    public String getMeetingCode() {
        return meeting != null ? meeting.getMeetingCode() : null;
    }
}
