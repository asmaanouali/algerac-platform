package com.algerac.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpertSignupRequest {
    
    // === SECTION 1: IDENTIFICATION ===
    @NotBlank(message = "Le nom est requis")
    private String nom;
    
    @NotBlank(message = "Le prénom est requis")
    private String prenom;
    
    @NotNull(message = "La date de naissance est requise")
    private LocalDate dateNaissance;
    
    @NotBlank(message = "La nationalité est requise")
    private String nationalite;
    
    @NotBlank(message = "La situation familiale est requise")
    private String situationFamiliale;
    
    private String photoBase64; // Photo en base64
    
    // === SECTION 2: CONTACTS ===
    @NotBlank(message = "L'email est requis")
    @Email(message = "Email invalide")
    private String email;
    
    @NotBlank(message = "Le téléphone est requis")
    private String telephone;
    
    private String telephoneMobile;
    
    private String fax;
    
    private String adresseDomicile;
    
    private String adresseEntreprise;
    
    // Contact d'urgence
    private String contactUrgenceNom;
    private String contactUrgenceTelephone;
    private String contactUrgenceMobile;
    
    // === SECTION 3: FORMATIONS ACADÉMIQUES ===
    private List<FormationAcademique> formationsAcademiques;
    
    // === SECTION 3bis: AUTRES FORMATIONS ===
    private List<AutreFormation> autresFormations;
    
    // === SECTION 4: EXPÉRIENCE PROFESSIONNELLE ===
    private List<ExperienceProfessionnelle> experiencesProfessionnelles;
    
    // === SECTION 5: ÉVALUATIONS/AUDITS RÉALISÉS ===
    private List<EvaluationAudit> evaluationsAudits;
    
    // === SECTION 6: FORMATIONS DISPENSÉES ===
    private List<FormationDispensee> formationsDispensees;
    
    // === SECTION 7: CONNAISSANCES LINGUISTIQUES ===
    private List<ConnaissanceLinguistique> connaissancesLinguistiques;
    
    // === SECTION 8: DIVERS ===
    private String informationsComplementaires;
    
    // === DOMAINE D'EXPERTISE (NOUVEAU) ===
    @NotBlank(message = "Le domaine d'expertise est requis")
    private String domaineExpertise;
    
    private String sousDomaineExpertise;
    
    // === METADATA ===
    @NotBlank(message = "Le type d'utilisateur est requis")
    private String userType; // "EXPERT", "EVALUATEUR", "FORMATEUR"
    
    // Documents joints à la candidature
    private List<DocumentJoint> documents;
    
    // Nested Classes
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentJoint {
        private String name;
        private String base64;
        private String mimeType;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FormationAcademique {
        private String dateDebut;
        private String dateFin;
        private String duree;
        private String dateDuree;
        private String universite;
        private String cours;
        private String specialite;
        private String diplome;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AutreFormation {
        private String dateDebut;
        private String dateFin;
        private String duree;
        private String institution;
        private String cours;
        private String specialite;
        private String certificat;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExperienceProfessionnelle {
        private String dateDebut;
        private String dateFin;
        private String organisme;
        private String poste;
        private String activitesPrincipales;
        private String domaineCompetence;
        private String sousDomaineCompetence;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvaluationAudit {
        private String moisAnnee;
        private String typeEvaluation;
        private String roleTenu;
        private String normesReferentiels;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FormationDispensee {
        private String dateDebut;
        private String duree;
        private String intituleFormation;
        private String controleParAlgerac;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConnaissanceLinguistique {
        private String langue;
        private String niveauLu;      // Basique, Assez bien, Bien, Très bien, Excellent
        private String niveauParle;   // Basique, Assez bien, Bien, Très bien, Excellent
        private String niveauEcrit;   // Basique, Assez bien, Bien, Très bien, Excellent
    }
}