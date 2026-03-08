package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "oec_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OECApplication {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String nomOrganisme;
    
    private String typeOrganisme;
    private String adresseSiege;
    private String telephone;
    
    @Column(nullable = false)
    private String email;
    
    private String nomRepresentant;
    private String fonction;
    private String telephoneDirect;
    private String emailProfessionnel;
    private String porteeAccreditation;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ApplicationStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Motif de refus par le DT
    
    @Column(columnDefinition = "TEXT")
    private String manquements; // Manquements identifiés par le DT lors du rejet
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime reviewedByDtAt; // Date d'examen par le DT
    private LocalDateTime approvedByAdminAt; // Date de création du compte par l'admin
    
    private Long reviewedByDtUserId; // ID du DT qui a examiné
    private Long approvedByAdminUserId; // ID de l'admin qui a créé le compte
    
    @Column(columnDefinition = "TEXT")
    private String formDataJson; // Données complètes du formulaire en JSON
    
    // --- Champs DAG (frais de dépôt) ---
    @Column(precision = 12, scale = 2)
    private BigDecimal depositFeeAmount; // Montant des frais de dépôt fixé par le DAG
    
    private LocalDateTime feeSetAt; // Date de fixation des frais
    private Long feeSetByUserId; // ID du DAG qui a fixé les frais
    
    private LocalDateTime paymentDeadline; // Deadline de paiement (1 mois après fixation)
    
    private LocalDateTime paymentVerifiedAt; // Date de vérification du paiement par le DAG
    private Long paymentVerifiedByUserId; // ID du DAG qui a vérifié le paiement
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ApplicationStatus.PENDING_DT;
        }
    }
    
    public enum ApplicationStatus {
        PENDING_DT,               // En attente d'examen par le DT
        APPROVED_BY_DT,           // Approuvé par le DT → envoyé au DAG
        AWAITING_DAG_FEE,         // En attente de fixation des frais par le DAG
        FEE_SET_AWAITING_PAYMENT, // Frais fixés, en attente de paiement par l'OEC
        PAYMENT_VERIFIED,         // Paiement vérifié par le DAG → admin doit créer le compte
        PAYMENT_EXPIRED,          // Délai de paiement dépassé (rejet automatique)
        REJECTED_BY_DT,           // Rejeté par le DT
        ACCOUNT_CREATED           // Compte créé par l'admin
    }
}
