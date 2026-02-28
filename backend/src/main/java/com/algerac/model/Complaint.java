package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String trackingCode;

    // Complainant info
    @Column(nullable = false)
    private String complainantName;

    @Column(nullable = false)
    private String complainantEmail;

    private String complainantPhone;
    private String complainantOrganization;

    // Complaint details
    private String targetOrganization;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String expectedResolution;

    // Source tracking
    @Column(nullable = false)
    private Boolean isPublic; // true = submitted from public form, false = submitted by authenticated user

    @ManyToOne
    @JoinColumn(name = "submitted_by_user_id")
    private User submittedByUser;

    private String submittedByRole;

    // Status & Decision
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    @Column(columnDefinition = "TEXT")
    private String decision;

    private LocalDateTime decisionDate;

    @Column(columnDefinition = "TEXT")
    private String rqNotes;

    @Column(columnDefinition = "TEXT")
    private String correctiveActions;

    // Attachments stored as JSON
    @Column(columnDefinition = "TEXT")
    private String attachmentsJson;

    // Timestamps
    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ComplaintStatus.RECEIVED;
        if (isPublic == null) isPublic = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
