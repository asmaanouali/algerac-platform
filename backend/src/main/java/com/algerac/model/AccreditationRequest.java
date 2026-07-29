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
    
    // Department that owns this request (routing target). Set by the DT when
    // validating the request, then used to scope CD/RA assignments and visibility.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private Department department;

    // Sequential request number assigned at OEC submission. The final accreditation
    // ID (AC/<domain>/<seq>/<year>) is composed later by the RA and stored in
    // referenceNumber once the file has been accepted. Kept separately so we can
    // always retrieve the simple sequence without parsing referenceNumber.
    private Integer sequenceNumber;

    // Workflow fields
    @ManyToOne
    @JoinColumn(name = "assigned_to_cd")
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private User assignedToCd; // CD assigné (basé sur le département)
    
    @ManyToOne
    @JoinColumn(name = "assigned_to_ra")
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private User assignedToRa; // RA assigné par le CD
    
    private LocalDateTime assignmentDate; // Date d'assignation au RA

    // Refus d'assignation par le RA (avant confirmation du dossier)
    @Column(columnDefinition = "TEXT")
    private String raRefusalReason; // Motif du refus donné par le RA

    private LocalDateTime raRefusalDate; // Date du refus

    private String refusedByRaName; // Nom du RA ayant refusé (conservé après désassignation)
    
    // DT review
    @Column(columnDefinition = "TEXT")
    private String dtReviewComments; // Commentaires du DT lors de la vérification des documents
    
    private LocalDateTime dtReviewDate; // Date de la revue DT
    
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
    
    // ─── PRO 26 : Multisites ─────────────────────────────────────────────
    /** Demande multisites (siège + sites satellites). Si false, demande monosite standard. */
    private Boolean isMultisite;

    /** Siège central (PRO 26 §2 : « siège social »). Renseigné uniquement si isMultisite = true. */
    private String mainSiteName;

    @Column(columnDefinition = "TEXT")
    private String mainSiteAddress;

    private String mainSiteContactName;
    private String mainSiteContactEmail;

    /** SM commun centralisé (PRO 26 §5.1) */
    private Boolean centralizedManagementSystem;

    @Column(columnDefinition = "TEXT")
    private String managementSystemDescription;

    /** URL du document décrivant les modalités d'échanges entre sites (PRO 26 §5.2-5) */
    @Column(columnDefinition = "TEXT")
    private String interSiteExchangesDoc;

    /** JSON : les 6 critères de qualification §5.1 cochés et justifiés par l'OEC (saisie). */
    @Column(columnDefinition = "TEXT")
    private String qualificationCriteriaJson;

    /** JSON : revue des critères §5.1 par le RA en recevabilité (PRO 26 §5.2.1). */
    @Column(columnDefinition = "TEXT")
    private String multisiteCriteriaReviewJson;

    /** Critères §5.1 vérifiés par RA/CD lors de la recevabilité (PRO 26 §5.2.1). */
    private Boolean multisiteQualificationReviewed;
    // ─────────────────────────────────────────────────────────────────────

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
                .typeDemande(oec.getTypeDemande())
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
    
    @JsonGetter("assignedToCd")
    public SimpleUserDTO getAssignedToCdForJson() {
        if (assignedToCd == null) return null;
        return SimpleUserDTO.builder()
                .id(assignedToCd.getId())
                .email(assignedToCd.getEmail())
                .fullName(assignedToCd.getFullName())
                .build();
    }

    @JsonGetter("department")
    public java.util.Map<String, Object> getDepartmentForJson() {
        if (department == null) return null;
        try {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", department.getId());
            m.put("code", department.getCode());
            m.put("name", department.getName());
            return m;
        } catch (Exception e) {
            return null;
        }
    }

    public Department getDepartment() {
        return department;
    }
    
    public User getOec() {
        return oec;
    }
    
    public User getAssignedToRa() {
        return assignedToRa;
    }
    
    public User getAssignedToCd() {
        return assignedToCd;
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
