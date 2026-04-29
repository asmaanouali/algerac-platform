package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "feasibility_studies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeasibilityStudy {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private AccreditationRequest request;
    
    @ManyToOne
    @JoinColumn(name = "ra_id", nullable = false)
    private User responsableAccreditation;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeasibilityDecision decision; // PENDING, RECEIVABLE, NOT_RECEIVABLE
    
    @Column(columnDefinition = "TEXT")
    private String comments; // Commentaires du RA
    
    @Column(columnDefinition = "TEXT")
    private String technicalAnalysis; // Analyse technique simplifiée
    
    @Column(columnDefinition = "TEXT")
    private String complianceCheck; // Vérification de conformité
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Raison de rejet si non recevable
    
    private LocalDateTime studyStartDate;
    private LocalDateTime studyCompletionDate;

    /** Brouillon intermédiaire sérialisé en JSON – persiste la progression du RA entre les sessions. */
    @Column(columnDefinition = "TEXT")
    private String draftJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (decision == null) {
            decision = FeasibilityDecision.PENDING;
        }
        if (studyStartDate == null) {
            studyStartDate = LocalDateTime.now();
        }
    }
    
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
    
    public Long getRaId() {
        return responsableAccreditation != null ? responsableAccreditation.getId() : null;
    }
    
    public String getRaName() {
        return responsableAccreditation != null ? responsableAccreditation.getFullName() : null;
    }
}
