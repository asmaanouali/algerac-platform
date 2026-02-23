package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    // Ajouté pour FOR 20 : type de candidature (EXPERT, EVALUATEUR, FORMATEUR)
    private String userType;

    // ID unique d'inscription (ex: EXP-0001, EVA-0002, FOR-0003)
    @Column(unique = true)
    private String registrationId;

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public String getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(String registrationId) {
        this.registrationId = registrationId;
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // COMMON FIELDS (matching TypeScript schema)
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password; // BCrypt hash
    
    @Column(nullable = false)
    private String fullName; // Combine nom + prenom for experts, or organization name for OEC
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    private String organizationName; // For OEC entities
    private String phone;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // OEC SPECIFIC FIELDS
    private String typeOrganisme;
    private String adresseSiege;
    private String nomRepresentant;
    private String fonction;
    private String telephoneDirect;
    private String emailProfessionnel;
    private String porteeAccreditation;
    
    // EXPERT SPECIFIC FIELDS
    private String nom;
    private String prenom;
    private String specialite;
    private String experience;
    private String diplomes;
    private String langues;
    private String disponibilite;
    
    // === NOUVEAUX CHAMPS FOR 20 ===
    
    // Section 1: Identification
    private LocalDate dateNaissance;
    private String nationalite;
    private String situationFamiliale;
    @Column(columnDefinition = "TEXT")
    private String photoBase64;
    
    // Section 2: Contacts
    private String telephoneMobile;
    private String fax;
    private String adresseDomicile;
    private String adresseEntreprise;
    private String contactUrgenceNom;
    private String contactUrgenceTelephone;
    private String contactUrgenceMobile;
    
    // Section 8: Divers
    private String informationsComplementaires;
    
    // NOUVEAU: Domaine d'expertise
    private String domaineExpertise;
    private String sousDomaineExpertise;
    
    // Données structurées (JSON)
    @Column(columnDefinition = "TEXT")
    private String formationsAcademiquesJson;
    
    @Column(columnDefinition = "TEXT")
    private String autresFormationsJson;
    
    @Column(columnDefinition = "TEXT")
    private String experiencesProfessionnellesJson;
    
    @Column(columnDefinition = "TEXT")
    private String evaluationsAuditsJson;
    
    @Column(columnDefinition = "TEXT")
    private String formationsDispenseesJson;
    
    @Column(columnDefinition = "TEXT")
    private String connaissancesLinguistiquesJson;
    
    // Documents joints à la candidature (tableau JSON [{name, base64, mimeType}])
    @Column(columnDefinition = "TEXT")
    private String documentsJson;
    
    // STATUS
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status; // PENDING, APPROVED, REJECTED
    private LocalDateTime dateApprobation;
    private String rejectionReason; // Motif de refus si rejeté
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = UserStatus.PENDING;
        }
        // Auto-fill fullName if not set
        if (fullName == null) {
            if (role == UserRole.EXPERT && nom != null && prenom != null) {
                fullName = prenom + " " + nom;
            } else if (organizationName != null) {
                fullName = organizationName;
            }
        }
    }
    
    // Helper method to get role as lowercase string (for JSON)
    public String getRoleLowercase() {
        return role != null ? role.name().toLowerCase() : null;
    }
}