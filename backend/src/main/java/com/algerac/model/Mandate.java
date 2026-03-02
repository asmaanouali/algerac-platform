package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mandates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mandate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "team_member_id", nullable = false)
    private TeamMember teamMember;

    @Column(columnDefinition = "TEXT")
    private String tasks;         // Tâches assignées

    @Column(columnDefinition = "TEXT")
    private String missions;      // Missions assignées

    @Column(columnDefinition = "TEXT")
    private String objectives;    // Objectifs spécifiques

    @Column(columnDefinition = "TEXT")
    private String cdComments;    // Commentaires/modifications demandées par CD

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MandateStatus status;

    private LocalDateTime sentToCdAt;
    private LocalDateTime cdApprovedAt;
    private LocalDateTime sentToMemberAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = MandateStatus.DRAFT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // JSON helper getters
    public Long getRequestId() { return request != null ? request.getId() : null; }
    public String getRequestReference() { return request != null ? request.getReferenceNumber() : null; }
    public Long getTeamMemberId() { return teamMember != null ? teamMember.getId() : null; }
    public String getMemberName() { return teamMember != null && teamMember.getExpert() != null ? teamMember.getExpert().getFullName() : null; }
    public String getMemberRole() { return teamMember != null ? teamMember.getRole().name() : null; }
    public String getMemberEmail() { return teamMember != null && teamMember.getExpert() != null ? teamMember.getExpert().getEmail() : null; }
    public Long getMemberExpertId() { return teamMember != null && teamMember.getExpert() != null ? teamMember.getExpert().getId() : null; }
}
