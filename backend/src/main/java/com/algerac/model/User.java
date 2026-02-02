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
    
    // STATUS
    private String status; // "PENDING", "APPROVED", "REJECTED"
    private LocalDateTime dateApprobation;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
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
