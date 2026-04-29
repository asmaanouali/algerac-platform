package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Bulletin d'information régulière aux évaluateurs/experts (PRO 06 §5.6).
 * Forums d'harmonisation (≥1/an), nouvelles exigences EA/ILAC/IAF, mises à jour normes.
 */
@Entity
@Table(name = "regular_info_bulletins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegularInfoBulletin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 30)
    private String type; // FORUM_HARMONISATION / NEW_REQUIREMENT / NORM_UPDATE / OTHER

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDate publishedDate;
    private LocalDate forumDate; // si type = FORUM_HARMONISATION

    /** Cibles : ALL, EVALUATORS, EXPERTS, ROLE:REE, etc. */
    @Column(length = 100)
    private String audience;

    @Column(length = 200)
    private String referencesJson; // EA/ILAC/IAF doc references

    @Column(length = 500)
    private String externalLink;

    @ManyToOne
    @JoinColumn(name = "published_by_id")
    private User publishedBy;

    private Boolean emailDispatched;
    private LocalDateTime emailDispatchedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (publishedDate == null) publishedDate = LocalDate.now();
    }
}
