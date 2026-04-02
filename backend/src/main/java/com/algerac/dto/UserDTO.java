package com.algerac.dto;

import com.algerac.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    
    private Long id;
    private String nom;
    private String prenom;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private List<String> roles; // All roles this user can switch to
    private String userType;
    private String status;
    private String fonction;
    private String telephone;
    private LocalDate dateNaissance;
    private String nationalite;
    private String domaineExpertise;
    private String sousDomaineExpertise;
    
    // Pour les OEC
    private String organizationName;
    private String typeOrganisme;
    
    private LocalDateTime createdAt;
    private String dateInscription;
    
    /**
     * Convertit un User en UserDTO
     */
    public static UserDTO fromUser(User user) {
        // Calculer le fullName
        String fullName = null;
        if (user.getNom() != null && user.getPrenom() != null) {
            fullName = user.getPrenom() + " " + user.getNom();
        } else if (user.getOrganizationName() != null) {
            fullName = user.getOrganizationName();
        } else if (user.getFullName() != null) {
            fullName = user.getFullName();
        }
        
        // Formater la date d'inscription
        String dateInscription = user.getCreatedAt() != null ? user.getCreatedAt().toString() : null;
        
        UserDTOBuilder builder = UserDTO.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .fullName(fullName)
                .email(user.getEmail())
                .phone(user.getPhone())
                .telephone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .roles(user.getAllRoles().stream()
                        .map(r -> r.name())
                        .collect(Collectors.toList()))
                .userType(user.getUserType())
                .fonction(user.getFonction())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .createdAt(user.getCreatedAt())
                .dateInscription(dateInscription);
        
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
}