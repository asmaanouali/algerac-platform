package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private String paymentType; // "REGISTRATION_FEE", "SURVEILLANCE_FEE", etc.
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;
    
    private String transactionId; // ID de la transaction de paiement
    
    private String paymentMethod; // "BANK_TRANSFER" (ordre de virement) ou "CHECK" (chèque remis à ALGERAC)

    // Banque émettrice du chèque (paiement par chèque uniquement; le n° de chèque est stocké dans transactionId)
    private String checkBank;
    
    private LocalDateTime paymentDate;
    
    // Preuve de paiement (base64 ou chemin)
    @Column(columnDefinition = "TEXT")
    private String proofDocumentBase64;
    
    private String proofDocumentName;
    
    private String proofDocumentMimeType;
    
    // Validation par le DAG
    private Boolean dagValidated;
    
    private LocalDateTime dagValidatedDate;
    
    @Column(columnDefinition = "TEXT")
    private String dagComments;
    
    private Long dagValidatedById; // ID du DAG qui a validé
    
    // Date à laquelle les frais ont été fixés par le DAG
    private LocalDateTime feeSetDate;
    
    private Long feeSetById; // ID du DAG qui a fixé les frais

    // Échéance de paiement (PRO18 §6: 20 jours frais évaluation, 60 jours redevance annuelle)
    private LocalDateTime dueDate;

    // Devise : DZD pour OEC nationaux, EUR ou USD pour OEC étrangers (PRO18-1)
    @Builder.Default
    private String currency = "DZD";

    // Numéro de facture (format: FACT-YYYY-NNNN)
    private String invoiceNumber;

    /**
     * Distingue un OEC nouvellement inscrit (candidature) d'un OEC déjà existant.
     * true  = nouvel OEC (inscription publique, compte pas encore pleinement actif)
     * false = OEC existant (nouvelle demande d'accréditation)
     */
    @Column(name = "is_new_oec")
    @Builder.Default
    private Boolean isNewOec = false;
    
    /**
     * true = la Consolidation a décidé que l'OEC règle ces frais à la fin de l'évaluation
     * (le RA n'est pas bloqué dans son étude de recevabilité). Repasse à false quand le
     * paiement devient exigible.
     */
    @Column(name = "deferred_to_evaluation_end")
    @Builder.Default
    private Boolean deferredToEvaluationEnd = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }
    
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
}
