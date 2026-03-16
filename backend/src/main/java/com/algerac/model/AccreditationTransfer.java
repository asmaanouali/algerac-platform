package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_31 : Transfert d'accréditation.
 * Gère le transfert d'accréditation d'un organisme à un autre (ex: changement de structure juridique).
 */
@Entity
@Table(name = "accreditation_transfers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String transferCode;

    @ManyToOne
    @JoinColumn(name = "original_request_id", nullable = false)
    private AccreditationRequest originalRequest;

    @ManyToOne
    @JoinColumn(name = "original_certificate_id")
    private AccreditationCertificate originalCertificate;

    // Organisme source
    @ManyToOne
    @JoinColumn(name = "source_oec_id", nullable = false)
    private User sourceOec;

    private String sourceOrganizationName;
    @Column(columnDefinition = "TEXT")
    private String sourceOrganizationDetails;

    // Organisme cible
    @ManyToOne
    @JoinColumn(name = "target_oec_id")
    private User targetOec;

    private String targetOrganizationName;
    @Column(columnDefinition = "TEXT")
    private String targetOrganizationDetails;

    // Motif du transfert
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferReason reason;

    @Column(columnDefinition = "TEXT")
    private String reasonDetails;

    // Portée transférée
    @Column(columnDefinition = "TEXT")
    private String transferredScope;         // Portée d'accréditation transférée

    private Boolean fullScopeTransfer;       // Transfert intégral de la portée ?
    @Column(columnDefinition = "TEXT")
    private String scopeModifications;       // Modifications de portée le cas échéant

    // Évaluation de transfert
    private Boolean evaluationRequired;      // Évaluation requise ?
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;

    private Boolean managementSystemContinuity; // Continuité du système de management ?
    private Boolean personnelContinuity;        // Continuité du personnel clé ?
    private Boolean equipmentContinuity;        // Continuité des équipements ?

    @Column(columnDefinition = "TEXT")
    private String continuityAssessment;

    // Décision
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status;

    @ManyToOne
    @JoinColumn(name = "decision_by_id")
    private User decisionBy;               // CD ou DG

    private LocalDateTime decisionDate;
    @Column(columnDefinition = "TEXT")
    private String decisionJustification;

    // Nouveau certificat
    @ManyToOne
    @JoinColumn(name = "new_certificate_id")
    private AccreditationCertificate newCertificate;

    private LocalDateTime newCertificateIssueDate;
    private LocalDateTime originalCertificateCancellationDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = TransferStatus.INITIATED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
