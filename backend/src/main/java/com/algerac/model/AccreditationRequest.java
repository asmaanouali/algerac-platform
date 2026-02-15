package com.algerac.model;

import com.algerac.dto.SimpleUserDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonGetter;
import jakarta.persistence.*;
import lombok.*;
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
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private User oec;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;
    
    @Column(nullable = false)
    private String domain; // e.g., "Laboratoire Essais", "Inspection"
    
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
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private User assignedToRa; // RA assigné par le CD
    
    private LocalDateTime assignmentDate; // Date d'assignation au RA
    
    // Recevabilité
    @Column(columnDefinition = "TEXT")
    private String receivabilityComments; // Commentaires du RA sur la recevabilité
    
    private LocalDateTime receivabilityDecisionDate; // Date de la décision de recevabilité
    
    private Boolean isReceivable; // Recevable ou non
    
    @Column(columnDefinition = "TEXT")
    private String receivabilityCorrectionNeeded; // Corrections nécessaires si non recevable
    
    private LocalDateTime correctionDeadline; // Délai pour corriger
    
    private LocalDateTime correctionSubmittedDate; // Date de re-soumission après correction
    
    private Integer receivabilityAttempts; // Nombre de tentatives de correction
    
    // Visite préliminaire  
    private Boolean preliminaryVisitRequired;
    
    private Boolean preliminaryVisitAccepted;
    
    private LocalDateTime preliminaryVisitDate;
    
    // Workflow tracking
    @Column(columnDefinition = "TEXT")
    private String currentPhase; // Phase actuelle du workflow
    
    @Column(columnDefinition = "TEXT")
    private String currentStep; // Étape actuelle
    
    @Column(columnDefinition = "TEXT")
    private String nextAction; // Prochaine action requise
    
    @Column(columnDefinition = "TEXT")
    private String pendingWith; // En attente de qui (OEC, RA, CD, etc.)
    
    // Dates importantes
    private LocalDateTime evaluationStartDate;
    
    private LocalDateTime evaluationEndDate;
    
    private LocalDateTime casDecisionDate;
    
    private LocalDateTime certificateIssueDate;
    
    private LocalDateTime certificateExpirationDate;
    
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
    
    @JsonGetter("oec")
    public SimpleUserDTO getOecForJson() {
        if (oec == null) return null;
        return SimpleUserDTO.builder()
                .id(oec.getId())
                .email(oec.getEmail())
                .fullName(oec.getFullName())
                .organizationName(oec.getOrganizationName())
                .build();
    }
    
    @JsonGetter("assignedToRa")
    public SimpleUserDTO getAssignedToRaForJson() {
        if (assignedToRa == null) return null;
        return SimpleUserDTO.builder()
                .id(assignedToRa.getId())
                .email(assignedToRa.getEmail())
                .fullName(assignedToRa.getFullName())
                .build();
    }
    
    public User getOec() {
        return oec;
    }
    
    public User getAssignedToRa() {
        return assignedToRa;
    }
    
    public Long getOecId() {
        return oec != null ? oec.getId() : null;
    }
    
    public String getOecName() {
        return oec != null ? oec.getFullName() : null;
    }
    
    public String getOecEmail() {
        return oec != null ? oec.getEmail() : null;
    }
    
    public String getOecOrganizationName() {
        return oec != null ? oec.getOrganizationName() : null;
    }
    
    public Long getAssignedToRaId() {
        return assignedToRa != null ? assignedToRa.getId() : null;
    }
    
    public String getAssignedToRaName() {
        return assignedToRa != null ? assignedToRa.getFullName() : null;
    }
    
    public String getAssignedToRaEmail() {
        return assignedToRa != null ? assignedToRa.getEmail() : null;
    }
    
    public String getTypeLowercase() {
        return type != null ? type.name().toLowerCase() : null;
    }
    
    public String getStatusLowercase() {
        return status != null ? status.name().toLowerCase() : null;
    }
}
