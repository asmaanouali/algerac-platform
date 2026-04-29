package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO Revue Documentaire (v2) :
 * Chaque membre de l'équipe d'évaluation soumet sa propre décision
 * (FOR 56 / FOR 56-1) ; le REE consolide ensuite l'ensemble en une synthèse finale
 * envoyée au RA, qui se charge de notifier l'OEC.
 */
@Entity
@Table(name = "documentary_review_member_decisions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"review_id", "member_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentaryReviewMemberDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "review_id")
    private DocumentaryReview review;

    @ManyToOne(optional = false)
    @JoinColumn(name = "member_id")
    private User member;

    /** Rôle du membre dans l'équipe : REE / ET / EQ / EXPERT. */
    @Enumerated(EnumType.STRING)
    private UserRole memberRole;

    /** Décision individuelle : "CONFORME" ou "DEFICIENCY". */
    private String decision;

    @Column(columnDefinition = "TEXT")
    private String findings;            // Constats détaillés

    @Column(columnDefinition = "TEXT")
    private String evidence;            // Preuves / références

    @Column(columnDefinition = "TEXT")
    private String FOR56Content;        // Contenu de la fiche FOR 56 / 56-1

    private LocalDateTime submittedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
