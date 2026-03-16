package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mission_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MissionOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "team_member_id")
    private User teamMember;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(columnDefinition = "TEXT")
    private String missionDetails;

    @Column(columnDefinition = "TEXT")
    private String checklistTasks;

    @Column(columnDefinition = "TEXT")
    private String completedTasks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionOrderStatus status;

    private Boolean approvedByDT;
    private LocalDateTime dtApprovalDate;
    private Boolean approvedByDG;
    private LocalDateTime dgApprovalDate;

    @Column(columnDefinition = "TEXT")
    private String rejectionNotes;

    private LocalDateTime sentToMemberDate;
    private LocalDateTime missionStartDate;
    private LocalDateTime missionEndDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = MissionOrderStatus.DRAFT;
        if (approvedByDT == null) approvedByDT = false;
        if (approvedByDG == null) approvedByDG = false;
    }

    public Long getRequestId() { return request != null ? request.getId() : null; }
    public Long getTeamMemberId() { return teamMember != null ? teamMember.getId() : null; }
    public String getTeamMemberName() { return teamMember != null ? teamMember.getFullName() : null; }
}
