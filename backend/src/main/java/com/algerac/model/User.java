package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
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

    // Timestamp of the last password change; AuthenticationFilter invalidates any session
    // issued before this instant, so a password reset forcibly logs out other active sessions.
    private LocalDateTime passwordChangedAt;
    
    @Column(nullable = false)
    private String fullName; // Combine nom + prenom for experts, or organization name for OEC
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;
    
    // Comma-separated list of all roles this user can switch to (e.g. "CD,CAS_MEMBER")
    // If null or empty, the user only has the single 'role' above
    private String roles;
    
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
    
    // Type de demande d'accréditation choisi à l'inscription (initiale, extension, renouvellement, transfert)
    private String typeDemande;
    
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
    private String wilaya;
    private String contactUrgenceNom;
    private String contactUrgenceTelephone;
    private String contactUrgenceMobile;
    
    // Section 8: Divers
    private String informationsComplementaires;
    
    // NOUVEAU: Domaine d'expertise
    private String domaineExpertise;
    private String sousDomaineExpertise;
    
    // Blacklist
    @Column(nullable = false)
    @Builder.Default
    private Boolean blacklisted = false;
    private String blacklistReason;
    private LocalDateTime blacklistedAt;
    
    // Rejection type tracking
    private String rejectionType; // "dossier" or "interview"
    
    // Starred/favorite candidate (good profile, consider for future)
    @Column(nullable = false)
    @Builder.Default
    private Boolean starred = false;
    
    // FOR28 secure access token
    @Column(unique = true)
    private String for28Token;
    private String for28SecretCode;
    private LocalDateTime for28TokenExpiresAt;
    private LocalDateTime for28SubmittedAt;
    
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
    private UserStatus status; // PENDING, INTERVIEW_SCHEDULED, INTERVIEW_CONFIRMED, INTERVIEW_COMPLETED, CANDIDATURE_APPROVED, APPROVED, REJECTED
    private LocalDateTime dateApprobation;
    private String rejectionReason; // Motif de refus si rejeté
    
    // INTERVIEW FIELDS
    private LocalDateTime interviewDate;
    private LocalDateTime interviewScheduledAt; // When the interview was scheduled (for 7-day deadline)
    
    @Column(columnDefinition = "TEXT")
    private String interviewNotes;
    
    @Column(columnDefinition = "TEXT")
    private String interviewChecklistJson; // JSON array of checklist items
    
    private String interviewDecision; // "ACCEPTED" or "REJECTED"
    private LocalDateTime interviewDecisionDate;
    
    // INTERVIEW PANEL - members who must be present at the interview
    private Long interviewPanelCdId;  // Chef de Département chosen for this interview
    private Long interviewPanelRaId;  // Responsable d'Accréditation chosen for this interview

    // Department (CD / RA / internal staff). OECs and experts may have null.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnore
    @Getter(AccessLevel.NONE)
    private Department department;

    public Department getDepartment() {
        return department;
    }

    @JsonGetter("department")
    public java.util.Map<String, Object> getDepartmentForJson() {
        if (department == null) return null;
        try {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", department.getId());
            m.put("code", department.getCode());
            m.put("name", department.getName());
            return m;
        } catch (Exception e) {
            return null;
        }
    }
    
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
            if (nom != null && prenom != null) {
                fullName = prenom + " " + nom;
            } else if (nom != null) {
                fullName = nom;
            } else if (prenom != null) {
                fullName = prenom;
            } else if (role == UserRole.OEC && organizationName != null) {
                fullName = organizationName;
            }
        }
    }
    
    // Helper method to get role as lowercase string (for JSON)
    public String getRoleLowercase() {
        return role != null ? role.name().toLowerCase() : null;
    }
    
    /**
     * Returns all roles this user can assume.
     * If 'roles' field is set, parse it; otherwise return just the primary role.
     */
    public java.util.List<UserRole> getAllRoles() {
        java.util.List<UserRole> result = new java.util.ArrayList<>();
        if (roles != null && !roles.isBlank()) {
            for (String r : roles.split(",")) {
                try {
                    result.add(UserRole.valueOf(r.trim()));
                } catch (IllegalArgumentException ignored) {}
            }
        }
        // Always include the primary role
        if (role != null && !result.contains(role)) {
            result.add(0, role);
        }
        return result;
    }
    
    /**
     * Check if this user can assume the given role.
     */
    public boolean hasRole(UserRole targetRole) {
        return getAllRoles().contains(targetRole);
    }
}