package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "surveillance_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveillancePlan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "certificate_id", nullable = false)
    private AccreditationCertificate certificate;
    
    @Column(nullable = false, unique = true)
    private String planCode; // FOR 66
    
    @Column(columnDefinition = "TEXT")
    private String surveillanceCalendar; // Calendrier des évaluations
    
    private String frequency; // Fréquence (généralement annuelle)
    
    @Column(columnDefinition = "TEXT")
    private String scopeSampling; // Échantillonnage portée par évaluation
    
    private Integer estimatedDurationPerEvaluation; // Durée estimée par évaluation
    
    // Cycle d'accréditation (PRO 25 §5.1)
    private Integer cycleNumber; // 1er cycle = 3 ans, 2ème+ = 4 ans
    private Integer cycleDurationYears; // 3 ou 4 ans
    private Integer surveillanceCount; // 2 (1er cycle) ou 3 (2ème+)
    
    private LocalDateTime nextSurveillanceDate;
    
    private Boolean satisfactionFormFOR22Sent; // FOR 22 envoyée à l'OEC
    
    @Column(columnDefinition = "TEXT")
    private String satisfactionFeedback; // Retour OEC sur FOR 22
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
