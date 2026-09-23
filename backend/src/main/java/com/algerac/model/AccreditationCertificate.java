package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "accreditation_certificates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationCertificate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cas_decision_id")
    private CASDecision casDecision;
    
    @Column(nullable = false, unique = true)
    private String certificateNumber;
    
    private LocalDateTime issueDate;
    
    private LocalDateTime expirationDate; // Généralement +4 ans
    
    @Column(columnDefinition = "TEXT")
    private String oecIdentity;
    
    @Column(columnDefinition = "TEXT")
    private String scope; // Portée détaillée d'accréditation
    
    @Column(columnDefinition = "TEXT")
    private String technicalDomains; // Domaines techniques
    
    @Column(columnDefinition = "TEXT")
    private String methodsAndStandards; // Méthodes/normes applicables
    
    @Column(columnDefinition = "TEXT")
    private String concernedSites; // Sites concernés

    // ─── PRO 26 : Multisites ─────────────────────────────────────────────
    /** Certificat multisites (PRO 26 §5.5). Si true → annexe technique listant tous les sites. */
    private Boolean isMultisite;

    /** Nom + adresse du siège central, repris en tête du certificat (§5.5-1). */
    @Column(columnDefinition = "TEXT")
    private String hqNameAndAddress;

    /** JSON : annexe technique — liste de tous les sites accrédités (§5.5-1). */
    @Column(columnDefinition = "TEXT")
    private String accreditedSitesJson;

    /** Modèle de certificat : FOR_16 / FOR_16_1 / FOR_16_3 (§5.5). */
    @Enumerated(EnumType.STRING)
    private CertificateTemplate certificateTemplate;
    // ─────────────────────────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String limitations; // Limitations éventuelles
    
    private String accreditationStandardReference; // Référence norme d'accréditation
    
    private Boolean signedByDG;
    
    private Boolean signedByDT;

    // ─── Circuit v2 de délivrance du certificat ────────────────────────
    /** DT a validé le certificat préparé (étape avant transmission à l'admin). */
    private Boolean validatedByDT;
    private LocalDateTime dtValidationDate;

    @Column(columnDefinition = "TEXT")
    private String dtValidationComments;

    /** Certificat envoyé à l'ADMIN pour mise en forme finale. */
    private LocalDateTime sentToAdminAt;

    /** Certificat + annexe transmis au service Consolidation. */
    private LocalDateTime sentToConsolidationAt;

    /** Numéro de facture émise par la Consolidation. */
    private String invoiceNumber;

    /** Montant de la facture pour la délivrance du certificat. */
    private java.math.BigDecimal invoiceAmount;

    /** Date d'émission de la facture par la Consolidation. */
    private LocalDateTime invoiceIssuedAt;

    /** Date d'envoi de la facture à l'OEC. */
    private LocalDateTime invoiceSentToOECAt;

    /** L'OEC a-t-il payé la facture pour récupérer le certificat ? */
    private Boolean invoicePaid;
    private LocalDateTime invoicePaidAt;

    /** Certificat + annexe effectivement remis à l'OEC (post-paiement). */
    private LocalDateTime certificateDeliveredToOECAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consolidation_user_id")
    private User consolidationUser;
    // ───────────────────────────────────────────────────────────────────
    
    private Boolean published; // Publié sur site web ALGERAC
    
    @Column(columnDefinition = "TEXT")
    private String certificateUrl; // URL du certificat PDF
    
    @Column(columnDefinition = "TEXT")
    private String technicalAnnexUrl; // URL de l'annexe technique
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
