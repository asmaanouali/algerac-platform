package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Suivi des formations - Formation initiale et journées de recyclage
 */
@Entity
@Table(name = "training_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    // Type de formation
    private String trainingType; // "INITIALE", "RECYCLAGE", "NORME_SPECIFIQUE", "MANAGEMENT_RE", "SENSIBILISATION_EXPERT"

    // Détails de la formation
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    private String normReference;  // ex: "17025", "15189", "17020"

    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationHours;

    // Formateur
    private String trainerName;
    private String trainerOrganization;

    // Examen
    private Boolean examPassed;
    private Double examScore;         // Score en pourcentage
    private Double examPassThreshold; // Seuil de réussite (70%)

    // Statut
    private String recordStatus;  // "PLANNED", "IN_PROGRESS", "COMPLETED", "FAILED"

    // Attestation
    private String certificateReference;
    private LocalDate certificateDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (examPassThreshold == null) examPassThreshold = 70.0;
    }
}
