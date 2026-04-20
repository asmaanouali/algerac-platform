package com.algerac.model;

import com.algerac.dto.SimpleUserDTO;
import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * PRO_31 : Transfert d'accréditation.
 * Gère le transfert d'accréditation d'un organisme à un autre.
 * Cas couverts : restructuration, création filiale, cession de portée, fusion d'OEC.
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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_request_id", nullable = false)
    private AccreditationRequest originalRequest;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_certificate_id")
    private AccreditationCertificate originalCertificate;

    // Organisme source (demandeur du transfert)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_oec_id", nullable = false)
    private User sourceOec;

    private String sourceOrganizationName;
    @Column(columnDefinition = "TEXT")
    private String sourceOrganizationDetails;

    // Organisme cible (bénéficiaire du transfert)
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_oec_id")
    private User targetOec;

    private String targetOrganizationName;
    @Column(columnDefinition = "TEXT")
    private String targetOrganizationDetails;

    private Boolean targetIsNewEntity;  // Bénéficiaire en cours de création (nouvelle filiale) ?

    // Motif du transfert
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferReason reason;

    @Column(columnDefinition = "TEXT")
    private String reasonDetails;

    // Portée transférée
    @Column(columnDefinition = "TEXT")
    private String transferredScope;

    private Boolean fullScopeTransfer;
    @Column(columnDefinition = "TEXT")
    private String scopeModifications;

    // --- Analyse des risques (PRO 31 §5) ---
    private Boolean impartialityCompliance;         // Respect des exigences d'impartialité
    private Boolean managementSystemContinuity;     // Dispositions du système de management
    private Boolean personnelContinuity;            // Ressources en personnel
    private Boolean equipmentContinuity;            // Ressources en équipements et locaux
    private Boolean assessmentMethodsContinuity;    // Méthodes d'évaluation de la conformité
    @Column(columnDefinition = "TEXT")
    private String lastEvaluationStatus;            // État des écarts et plan d'action

    @Column(columnDefinition = "TEXT")
    private String riskAnalysis;                    // Analyse des risques documentée

    @Column(columnDefinition = "TEXT")
    private String continuityAssessment;            // Évaluation globale de continuité

    private Boolean financialRegularized;           // Situation financière régularisée

    // --- Étude de faisabilité (FOR 86, PRO 31 §5.2) ---
    @Column(columnDefinition = "TEXT")
    private String feasibilityStudy;                // Résultat de l'étude de faisabilité
    private String feasibilityStudyRef;             // Référence FOR 86

    // --- Évaluation supplémentaire ---
    private Boolean evaluationRequired;
    @Column(columnDefinition = "TEXT")
    private String evaluationFindings;

    // Documents joints (JSON: [{name, type, data(base64)}])
    @Column(columnDefinition = "TEXT")
    private String attachedDocuments;

    // --- Décision CAS (PRO 31 §5.3) ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransferStatus status;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decision_by_id")
    private User decisionBy;

    private LocalDateTime decisionDate;
    @Column(columnDefinition = "TEXT")
    private String decisionJustification;

    // Date de prise d'effet = date de la décision CAS
    private LocalDateTime effectiveDate;

    // Numéro d'accréditation maintenu (même numéro)
    private String accreditationNumber;

    // Plan de surveillance mis à jour (FOR 66)
    private String surveillancePlanRef;

    // --- Nouveau certificat ---
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "new_certificate_id")
    private AccreditationCertificate newCertificate;

    private LocalDateTime newCertificateIssueDate;
    private LocalDateTime originalCertificateCancellationDate;

    // Date de fin de validité inchangée (copiée du certificat original)
    private LocalDateTime originalExpirationDate;

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

    // --- JSON serialization helpers ---

    @JsonGetter("originalRequestId")
    public Long getOriginalRequestIdForJson() {
        return originalRequest != null ? originalRequest.getId() : null;
    }

    @JsonGetter("originalRequestRef")
    public String getOriginalRequestRefForJson() {
        return originalRequest != null ? originalRequest.getReferenceNumber() : null;
    }

    @JsonGetter("originalCertificateNumber")
    public String getOriginalCertificateNumberForJson() {
        return originalCertificate != null ? originalCertificate.getCertificateNumber() : null;
    }

    @JsonGetter("sourceOecId")
    public Long getSourceOecIdForJson() {
        return sourceOec != null ? sourceOec.getId() : null;
    }

    @JsonGetter("targetOecId")
    public Long getTargetOecIdForJson() {
        return targetOec != null ? targetOec.getId() : null;
    }

    @JsonGetter("decisionByUser")
    public SimpleUserDTO getDecisionByForJson() {
        if (decisionBy == null) return null;
        return SimpleUserDTO.builder()
                .id(decisionBy.getId())
                .fullName(decisionBy.getFullName())
                .build();
    }

    @JsonGetter("newCertificateNumber")
    public String getNewCertificateNumberForJson() {
        return newCertificate != null ? newCertificate.getCertificateNumber() : null;
    }
}
