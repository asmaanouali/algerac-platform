package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "quotations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quotation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false, unique = true)
    private String quotationNumber; // Numéro de devis (ex: DEV-2024-001)
    
    @ManyToOne
    @JoinColumn(name = "prepared_by_ra", nullable = false)
    private User preparedByRa;
    
    @ManyToOne
    @JoinColumn(name = "approved_by_dag")
    private User approvedByDag;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuotationStatus status; // DRAFT, SENT_TO_DAG, APPROVED_BY_DAG, SENT_TO_OEC, VALIDATED_BY_OEC, REJECTED_BY_OEC
    
    @Column(nullable = false)
    private BigDecimal amount; // Montant du devis (défini par le DAG)
    
    @Column(columnDefinition = "TEXT")
    private String details; // Détails du devis
    
    @Column(columnDefinition = "TEXT")
    private String dagComments; // Commentaires du DAG

    /**
     * Détail HT du devis (FOR 44 / 44-1 / 44-2) saisi par le DAG.
     * Format legacy : { "registrationFee": 1000, ... }
     * Format feuille : { "amounts": {...}, "sheet": { "columns": [...], "rows": [...] } }
     */
    @Column(columnDefinition = "TEXT")
    private String devisBreakdownJson;

    /** Numéro du devis estimatif (saisi par le DAG, optionnel). */
    private String devisEstimatifNumber;

    /** Date du devis estimatif (saisie par le DAG, optionnel). */
    private java.time.LocalDate devisEstimatifDate;

    /** Site (nom + adresse) figurant sur le devis estimatif. */
    private String siteName;

    @Column(columnDefinition = "TEXT")
    private String siteAddress;
    
    // Composition équipe proposée par le RA (demande d'établissement du devis)
    @Column(nullable = false)
    @Builder.Default
    private Integer reeCount = 1; // REE toujours fixé à 1
    
    @Column(nullable = false)
    @Builder.Default
    private Integer etCount = 1; // Évaluateur technique, minimum 1
    
    @Builder.Default
    private Integer eqCount = 0; // Évaluateur qualité
    
    @Builder.Default
    private Integer obsCount = 0; // Observateur
    
    @Builder.Default
    private Integer supCount = 0; // Superviseur
    
    @Builder.Default
    private Integer expCount = 0; // Expert
    
    private Double evaluationDurationDays; // Durée totale de l'évaluation en H/j
    
    // Durée par type de membre (H/j)
    private Double reeDurationDays;
    private Double etDurationDays;
    private Double eqDurationDays;
    private Double obsDurationDays;
    private Double supDurationDays;
    private Double expDurationDays;
    
    // Demande d'aide au CD pour estimation
    @Builder.Default
    private Boolean cdHelpRequested = false;
    
    @Column(columnDefinition = "TEXT")
    private String cdHelpMessage;
    
    private LocalDateTime sentToDagDate;
    private LocalDateTime approvedByDagDate;
    private LocalDateTime sentToOecDate;
    private LocalDateTime validatedByOecDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = QuotationStatus.DRAFT;
        }
    }
    
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
    
    public Long getPreparedByRaId() {
        return preparedByRa != null ? preparedByRa.getId() : null;
    }
    
    public String getPreparedByRaName() {
        return preparedByRa != null ? preparedByRa.getFullName() : null;
    }
    
    public Long getApprovedByDagId() {
        return approvedByDag != null ? approvedByDag.getId() : null;
    }
    
    public String getApprovedByDagName() {
        return approvedByDag != null ? approvedByDag.getFullName() : null;
    }

    public String getRequestReferenceNumber() {
        return request != null ? request.getReferenceNumber() : null;
    }

    public String getRequestType() {
        return request != null && request.getType() != null ? request.getType().name() : null;
    }

    public String getOecName() {
        if (request == null || request.getOecForJson() == null) return null;
        var dto = request.getOecForJson();
        return dto.getOrganizationName() != null ? dto.getOrganizationName() : dto.getFullName();
    }
}
