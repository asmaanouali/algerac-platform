package com.algerac.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OECSignupRequest {
    
    @NotBlank(message = "Le nom de l'organisme est requis")
    private String nomOrganisme;
    
    @NotBlank(message = "Le type d'organisme est requis")
    private String typeOrganisme;
    
    @NotBlank(message = "L'adresse du siège est requise")
    private String adresseSiege;
    
    @NotBlank(message = "Le téléphone est requis")
    private String telephone;
    
    @NotBlank(message = "L'email est requis")
    @Email(message = "Email invalide")
    private String email;
    
    @NotBlank(message = "Le nom du représentant est requis")
    private String nomRepresentant;
    
    @NotBlank(message = "La fonction est requise")
    private String fonction;
    
    @NotBlank(message = "Le téléphone direct est requis")
    private String telephoneDirect;
    
    @NotBlank(message = "L'email professionnel est requis")
    @Email(message = "Email professionnel invalide")
    private String emailProfessionnel;
    
    private String porteeAccreditation;
    
    private String typeDemande; // "initiale", "extension", "renouvellement", "transfert"
    
    @NotBlank(message = "Le type d'utilisateur est requis")
    private String userType; // "OEC"
    
    private String description; // Données complètes du formulaire en JSON
    
    // Documents joints (checklisteDocs + fichiers uploadés)
    private List<DocumentJoint> documents;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentJoint {
        private String key;
        private String name;
        private String base64;
        private String mimeType;
    }
}
