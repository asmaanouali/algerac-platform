package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "accreditation_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String referenceNumber; // Numéro de référence attribué par CD (ex: D-2024-001)
    
    @ManyToOne
    @JoinColumn(name = "oec_id", nullable = false)
    @JsonIgnoreProperties({"password", "createdAt", "status", "dateApprobation", "rejectionReason", 
        "formationsAcademiquesJson", "autresFormationsJson", "experiencesProfessionnellesJson", 
        "evaluationsAuditsJson", "formationsDispenseesJson", "connaissancesLinguistiquesJson"})
    private User oec;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;
    
    @Column(nullable = false)
    private String domain; // e.g., "Laboratoire Essais", "Inspection"
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description; // Description détaillée de la demande
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;
    
    @Column(nullable = false)
    private Integer progress; // 0-100
    
    // Workflow fields
    @ManyToOne
    @JoinColumn(name = "assigned_to_ra")
    @JsonIgnoreProperties({"password", "createdAt", "status", "dateApprobation", "rejectionReason", 
        "formationsAcademiquesJson", "autresFormationsJson", "experiencesProfessionnellesJson", 
        "evaluationsAuditsJson", "formationsDispenseesJson", "connaissancesLinguistiquesJson"})
    private User assignedToRa; // RA assigné par le CD
    
    private LocalDateTime assignmentDate; // Date d'assignation au RA
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String receivabilityComments; // Commentaires du RA sur la recevabilité
    
    private LocalDateTime receivabilityDecisionDate; // Date de la décision de recevabilité
    
    // Dates
    private LocalDateTime submissionDate; // Date de soumission initiale par OEC
    private LocalDateTime nextActionDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.DRAFT;
        }
        if (progress == null) {
            progress = 0;
        }
    }
    
    // Helper methods for JSON serialization
    public Long getOecId() {
        return oec != null ? oec.getId() : null;
    }
    
    public Long getAssignedToRaId() {
        return assignedToRa != null ? assignedToRa.getId() : null;
    }
    
    public String getAssignedToRaName() {
        return assignedToRa != null ? assignedToRa.getFullName() : null;
    }
    
    public String getTypeLowercase() {
        return type != null ? type.name().toLowerCase() : null;
    }
    
    public String getStatusLowercase() {
        return status != null ? status.name().toLowerCase() : null;
    }
}
