package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "preparation_meetings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreparationMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "organized_by")
    private User organizedBy;

    private LocalDate meetingDate;

    private String meetingTime; // e.g. "09:00"

    @Column(columnDefinition = "TEXT")
    private String location; // Locaux ALGERAC ou autre lieu

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String agenda; // Ordre du jour

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PreparationMeetingStatus status;

    private LocalDateTime invitationsSentAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = PreparationMeetingStatus.PLANNED;
    }

    public Long getRequestId() { return request != null ? request.getId() : null; }
    public String getRequestReference() { return request != null ? request.getReferenceNumber() : null; }
    public String getOrganizerName() { return organizedBy != null ? organizedBy.getFullName() : null; }
}
