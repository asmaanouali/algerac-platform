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
    
    private String paymentMethod; // "CARD", "BANK_TRANSFER", "CHECK", etc.
    
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
