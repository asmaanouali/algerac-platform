package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * FOR 65-2 — Formulaire de suivi des compétences des membres du CAS (PRO 07 §5.4).
 * Filled by HD/AO (CD/RA) at each file examination meeting.
 * Used at convention renewal (every 3 years) to decide maintain/terminate.
 */
@Entity
@Table(name = "for65_competency_tracking")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FOR65CompetencyTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meeting_id", nullable = false)
    private CASMeeting meeting;

    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private User member;

    /** CD/RA who filled this evaluation. */
    @ManyToOne
    @JoinColumn(name = "evaluated_by_id", nullable = false)
    private User evaluatedBy;

    // PRO 07 §5.4 — Ratings 1 (insufficient) to 5 (excellent)
    private Integer overallRating;
    private Integer technicalKnowledgeRating;
    private Integer impartialityRating;
    private Integer independenceRating;
    private Integer communicationRating;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String areasForImprovement;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    /**
     * PRO 07 §5.4 — Based on results, GM decides to maintain or terminate the SAC member convention.
     * This field captures the HD/RA recommendation.
     */
    private Boolean recommendMaintain;

    @Column(columnDefinition = "TEXT")
    private String maintenanceJustification;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @JsonProperty("memberId")
    public Long getMemberId() {
        return member != null ? member.getId() : null;
    }

    @JsonProperty("memberName")
    public String getMemberName() {
        return member != null ? member.getFullName() : null;
    }

    @JsonProperty("evaluatedById")
    public Long getEvaluatedById() {
        return evaluatedBy != null ? evaluatedBy.getId() : null;
    }

    @JsonProperty("evaluatedByName")
    public String getEvaluatedByName() {
        return evaluatedBy != null ? evaluatedBy.getFullName() : null;
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
