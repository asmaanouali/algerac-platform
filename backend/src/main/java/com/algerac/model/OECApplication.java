package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
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
    private ApplicationStatus status; // PENDING_DT, APPROVED_BY_DT, REJECTED_BY_DT, PENDING_ADMIN
    
    @Column(columnDefinition = "TEXT")
    private String rejectionReason; // Motif de refus par le DT
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime reviewedByDtAt; // Date d'examen par le DT
    private LocalDateTime approvedByAdminAt; // Date de création du compte par l'admin
    
    private Long reviewedByDtUserId; // ID du DT qui a examiné
    private Long approvedByAdminUserId; // ID de l'admin qui a créé le compte
    
    @Column(columnDefinition = "TEXT")
    private String formDataJson; // Données complètes du formulaire en JSON
    
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
        PENDING_DT,          // En attente d'examen par le DT
        APPROVED_BY_DT,      // Approuvé par le DT, en attente de création de compte par l'admin
        REJECTED_BY_DT,      // Rejeté par le DT
        ACCOUNT_CREATED      // Compte créé par l'admin
    }
}
