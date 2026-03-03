package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy; // Membre qui a signalé l'écart
    
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
    
    // Envoi au REE (membres → REE)
    private Boolean sentToREE;
    private LocalDateTime sentToREEDate;
    
    // Consensus REE
    private Boolean keptByREE; // REE garde cet écart
    @Column(columnDefinition = "TEXT")
    private String reeModifiedDescription; // REE peut modifier la description
    @Column(columnDefinition = "TEXT")
    private String reeModifiedEvidence;
    
    // Envoi à l'OEC (REE → OEC lors clôture)
    private Boolean sentToOEC;
    private LocalDateTime sentToOECDate;
    
    // Réponse OEC (Étape 7)
    private Boolean oecAccepted; // OEC accepte ou refuse l'écart
    @Column(columnDefinition = "TEXT")
    private String oecRefusalReason;
    private LocalDateTime oecResponseDate;
    
    // Règles de requalification
    private Integer countOnSameRequirement;
    private Boolean systematicMultiDepartment;
    private Boolean recurrentFromPrevious;
    private Boolean reclassifiedToCritical;
    
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
    
    @JsonProperty("createdByName")
    public String getCreatedByName() {
        return createdBy != null ? createdBy.getFullName() : null;
    }
    
    @JsonProperty("createdById")
    public Long getCreatedById() {
        return createdBy != null ? createdBy.getId() : null;
    }
    
    @JsonProperty("requestId")
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
}
