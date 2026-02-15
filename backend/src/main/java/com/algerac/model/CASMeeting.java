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

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = CASMeetingStatus.PLANNED;
    }

    public Long getRequestId() { return request != null ? request.getId() : null; }
}
