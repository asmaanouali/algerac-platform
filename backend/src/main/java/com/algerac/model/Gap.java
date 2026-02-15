package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gaps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Gap {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false, unique = true)
    private String gapCode; // Code unique de l'écart
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GapType type; // CRITIQUE, NON_CRITIQUE
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String requirement; // Exigence de la norme concernée
    
    @Column(columnDefinition = "TEXT")
    private String evidence; // Preuves/constats
    
    private LocalDateTime identifiedDate; // Date d'identification (clôture évaluation)
    
    @Column(columnDefinition = "TEXT")
    private String FOR02Content; // Contenu du FOR 02
    
    @Enumerated(EnumType.STRING)
    private GapStatus status;
    
    // Règles de requalification
    private Integer countOnSameRequirement; // Nombre d'écarts NC sur même exigence
    private Boolean systematicMultiDepartment; // Écart systématique multi-départements
    private Boolean recurrentFromPrevious; // Récurrent d'évaluation précédente
    private Boolean reclassifiedToCritical; // Requalifié en CRITIQUE
    
    @Column(columnDefinition = "TEXT")
    private String reclassificationReason;
    
    private LocalDateTime reclassificationDate;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = GapStatus.IDENTIFIED;
        }
    }
}
