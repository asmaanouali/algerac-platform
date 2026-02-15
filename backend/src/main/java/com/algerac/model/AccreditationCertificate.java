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
    
    @OneToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @OneToOne
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
    
    @Column(columnDefinition = "TEXT")
    private String limitations; // Limitations éventuelles
    
    private String accreditationStandardReference; // Référence norme d'accréditation
    
    private Boolean signedByDG;
    
    private Boolean signedByDT;
    
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
