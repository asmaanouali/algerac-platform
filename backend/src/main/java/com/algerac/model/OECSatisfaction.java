package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * FOR 21 - Fiche de satisfaction de l'OEC sur l'équipe d'évaluation
 */
@Entity
@Table(name = "oec_satisfaction_surveys")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OECSatisfaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Demande d'accréditation liée
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    // OEC qui a rempli le questionnaire
    @ManyToOne
    @JoinColumn(name = "oec_user_id", nullable = false)
    private User oecUser;

    // Évaluateur spécifiquement évalué (optionnel si évaluation de l'équipe globale)
    @ManyToOne
    @JoinColumn(name = "evaluator_id")
    private User evaluator;

    private LocalDate evaluationDate;

    // === Critères de satisfaction (1-5) ===
    private Integer scoreProfessionnalisme;       // Professionnalisme de l'équipe
    private Integer scoreCompetenceTechnique;     // Compétence technique
    private Integer scoreImpartialite;            // Impartialité
    private Integer scoreCommunication;           // Communication
    private Integer scoreRespectDelais;           // Respect des délais
    private Integer scoreClarte;                  // Clarté des constats et écarts
    private Integer scoreComportement;            // Comportement général
    private Integer scoreDisponibilite;           // Disponibilité et écoute

    // Score moyen calculé
    private Double scoreMoyen;

    // Commentaires
    @Column(columnDefinition = "TEXT")
    private String commentairesPositifs;

    @Column(columnDefinition = "TEXT")
    private String commentairesNegatifs;

    @Column(columnDefinition = "TEXT")
    private String suggestions;

    // Satisfaction globale (TRES_SATISFAIT, SATISFAIT, MOYENNEMENT_SATISFAIT, INSATISFAIT)
    private String satisfactionGlobale;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        calculateAverage();
    }

    public void calculateAverage() {
        int count = 0;
        double total = 0;
        int[] scores = {
            scoreProfessionnalisme != null ? scoreProfessionnalisme : 0,
            scoreCompetenceTechnique != null ? scoreCompetenceTechnique : 0,
            scoreImpartialite != null ? scoreImpartialite : 0,
            scoreCommunication != null ? scoreCommunication : 0,
            scoreRespectDelais != null ? scoreRespectDelais : 0,
            scoreClarte != null ? scoreClarte : 0,
            scoreComportement != null ? scoreComportement : 0,
            scoreDisponibilite != null ? scoreDisponibilite : 0
        };
        for (int s : scores) {
            if (s > 0) { total += s; count++; }
        }
        this.scoreMoyen = count > 0 ? Math.round((total / count) * 100.0) / 100.0 : 0.0;
    }
}
