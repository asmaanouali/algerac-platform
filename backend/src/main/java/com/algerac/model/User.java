package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String userType; // "OEC" ou "EXPERT"
    
    // Champs communs
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String telephone;
    
    // Champs pour OEC
    private String nomOrganisme;
    private String typeOrganisme;
    private String adresseSiege;
    private String nomRepresentant;
    private String fonction;
    private String telephoneDirect;
    private String emailProfessionnel;
    private String porteeAccreditation;
    
    // Champs pour Expert
    private String nom;
    private String prenom;
    private String specialite;
    private String experience;
    private String diplomes;
    private String langues;
    private String disponibilite;
    
    @Column(nullable = false)
    private String status; // "PENDING", "APPROVED", "REJECTED"
    
    @Column(nullable = false)
    private LocalDateTime dateInscription;
    
    private LocalDateTime dateApprobation;
    
    @PrePersist
    protected void onCreate() {
        dateInscription = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }
}
