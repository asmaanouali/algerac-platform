package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    private TeamRole authorTeamRole;

    @Column(columnDefinition = "TEXT")
    private String content; // Contenu principal de la note

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(columnDefinition = "TEXT")
    private String synthesis;

    @Column(columnDefinition = "TEXT")
    private String checklistStatus;

    @Column(nullable = false)
    private String noteType; // OPENING_MEETING, EVALUATION, CLOSING_MEETING, GENERAL

    private String section; // Section/domaine de la note

    private Boolean sentToREE;
    private LocalDateTime sentDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (sentToREE == null) sentToREE = false;
    }

    public Long getRequestId() { return request != null ? request.getId() : null; }
    public Long getAuthorId() { return author != null ? author.getId() : null; }
    public String getAuthorName() { return author != null ? author.getFullName() : null; }
}
