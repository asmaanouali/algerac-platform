package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * FOR 71 - Fiche d'observation et d'évaluation de l'évaluateur/expert sur site
 */
@Entity
@Table(name = "observation_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ObservationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Évaluateur observé
    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    // Observateur/évaluateur référent qui a rempli la fiche
    @ManyToOne
    @JoinColumn(name = "observer_id", nullable = false)
    private User observer;

    // Mission liée (optionnel - lien vers la demande d'accréditation)
    @ManyToOne
    @JoinColumn(name = "request_id")
    private AccreditationRequest request;

    // Qualification concernée
    @ManyToOne
    @JoinColumn(name = "qualification_id")
    private Qualification qualification;

    // Date de l'observation
    private LocalDate observationDate;

    // Type d'observation
    private String observationType;  // "QUALIFICATION_INITIALE", "SUPERVISION_PERIODIQUE", "RE_STAGIAIRE", "EXTENSION"

    // === SAVOIR-FAIRE (compétences techniques) ===
    private Integer scoreMaitriseTechnique;       // 1-5
    private Integer scoreRigueurExamen;           // 1-5
    private Integer scorePertinenceConstats;      // 1-5
    private Integer scoreRedactionRapports;       // 1-5
    private Integer scoreConnaissanceNormes;      // 1-5

    // === SAVOIR-ETRE (comportement) ===
    private Integer scoreComportement;            // 1-5
    private Integer scoreEcoute;                  // 1-5
    private Integer scoreImpartialite;            // 1-5
    private Integer scoreGestionTemps;            // 1-5
    private Integer scoreDiplomatie;              // 1-5

    // Score global calculé
    private Double scoreGlobal;

    // Avis de l'observateur
    @Enumerated(EnumType.STRING)
    private ObservationVerdict verdict;

    // Commentaires détaillés
    @Column(columnDefinition = "TEXT")
    private String pointsForts;

    @Column(columnDefinition = "TEXT")
    private String pointsAmeliorer;

    @Column(columnDefinition = "TEXT")
    private String recommandations;

    @Column(columnDefinition = "TEXT")
    private String commentairesGeneraux;

    // Conditions (si FAVORABLE_SOUS_RESERVE)
    @Column(columnDefinition = "TEXT")
    private String conditionsReserve;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        calculateGlobalScore();
    }

    public void calculateGlobalScore() {
        int count = 0;
        double total = 0;
        int[] scores = {
            scoreMaitriseTechnique != null ? scoreMaitriseTechnique : 0,
            scoreRigueurExamen != null ? scoreRigueurExamen : 0,
            scorePertinenceConstats != null ? scorePertinenceConstats : 0,
            scoreRedactionRapports != null ? scoreRedactionRapports : 0,
            scoreConnaissanceNormes != null ? scoreConnaissanceNormes : 0,
            scoreComportement != null ? scoreComportement : 0,
            scoreEcoute != null ? scoreEcoute : 0,
            scoreImpartialite != null ? scoreImpartialite : 0,
            scoreGestionTemps != null ? scoreGestionTemps : 0,
            scoreDiplomatie != null ? scoreDiplomatie : 0
        };
        for (int s : scores) {
            if (s > 0) { total += s; count++; }
        }
        this.scoreGlobal = count > 0 ? Math.round((total / count) * 100.0) / 100.0 : 0.0;
    }
}
