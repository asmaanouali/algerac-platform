package com.algerac.dto;

import com.algerac.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDate dateNaissance;
    private String nationalite;
    private String domaineExpertise;
    private String sousDomaineExpertise;
    
    // Pour les OEC
    private String organizationName;
    private String typeOrganisme;
    
    private LocalDateTime createdAt;
    
    /**
     * Convertit un User en UserDTO
     */
    public static UserDTO fromUser(User user) {
        UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRoleLowercase())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt());
        
        // Champs spécifiques aux experts
        if ("EXPERT".equals(user.getRole()) || "EVALUATEUR".equals(user.getRole()) || 
            "FORMATEUR".equals(user.getRole())) {
            builder.dateNaissance(user.getDateNaissance())
                   .nationalite(user.getNationalite())
                   .domaineExpertise(user.getDomaineExpertise())
                   .sousDomaineExpertise(user.getSousDomaineExpertise());
        }
        
        // Champs spécifiques aux OEC
        if ("OEC".equals(user.getRole())) {
            builder.organizationName(user.getOrganizationName())
                   .typeOrganisme(user.getTypeOrganisme());
        }
        
        return builder.build();
    }
    
    /**
     * Obtient le nom complet
     */
    public String getFullName() {
        if (nom != null && prenom != null) {
            return prenom + " " + nom;
        }
        return organizationName;
    }
}