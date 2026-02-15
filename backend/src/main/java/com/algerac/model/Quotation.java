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
    private BigDecimal amount; // Montant du devis
    
    @Column(columnDefinition = "TEXT")
    private String details; // Détails du devis
    
    @Column(columnDefinition = "TEXT")
    private String dagComments; // Commentaires du DAG
    
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
}
