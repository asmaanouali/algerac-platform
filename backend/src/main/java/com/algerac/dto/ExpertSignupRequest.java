package com.algerac.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpertSignupRequest {
    
    @NotBlank(message = "Le nom est requis")
    private String nom;
    
    @NotBlank(message = "Le prénom est requis")
    private String prenom;
    
    @NotBlank(message = "L'email est requis")
    @Email(message = "Email invalide")
    private String email;
    
    @NotBlank(message = "Le téléphone est requis")
    private String telephone;
    
    @NotBlank(message = "La spécialité est requise")
    private String specialite;
    
    private String experience;
    
    private String diplomes;
    
    private String langues;
    
    private String disponibilite;
    
    @NotBlank(message = "Le type d'utilisateur est requis")
    private String userType; // "EXPERT"
}
