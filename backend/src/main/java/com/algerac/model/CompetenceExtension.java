package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Demande d'extension de compétences (PRO 06 §5.6).
 * - EXP/ET : extension à un nouveau domaine via mise à jour FOR 20.
 * - REE/EQ : extension à un nouveau référentiel d'accréditation.
 */
@Entity
@Table(name = "competence_extensions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetenceExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne
    @JoinColumn(name = "qualification_id")
    private Qualification qualification;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluator_role")
    private TeamRole currentRole;

    /** Type : DOMAIN_EXTENSION (EXP/ET) ou STANDARD_EXTENSION (REE/EQ). */
    @Column(length = 30)
    private String extensionType;

    @Column(columnDefinition = "TEXT")
    private String requestedDomainsJson;    // JSON array of new domains

    @Column(columnDefinition = "TEXT")
    private String requestedStandardsJson;  // JSON array of new standards

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String evidenceDocumentsJson;   // updated FOR 20 + diplomas

    @Column(nullable = false, length = 30)
    private String status; // REQUESTED / UNDER_REVIEW / TRAINING_REQUIRED / APPROVED / REJECTED

    @ManyToOne
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy; // CD / DT

    private LocalDate reviewedDate;

    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    private LocalDate decisionDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "REQUESTED";
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
