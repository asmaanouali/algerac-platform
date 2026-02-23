package com.algerac.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateQuotationDTO {
    
    @NotNull(message = "L'ID de la demande est obligatoire")
    private Long requestId;
    
    // Le montant n'est plus défini par le RA - c'est le DAG qui le fixe
    // Le RA propose la composition de l'équipe et la durée
    
    private Integer reeCount; // Fixé à 1
    
    @NotNull(message = "Le nombre d'évaluateurs techniques est obligatoire")
    @Positive(message = "Il faut au minimum 1 évaluateur technique")
    private Integer etCount;
    
    private Integer eqCount; // Évaluateur qualité
    private Integer obsCount; // Observateur
    private Integer supCount; // Superviseur
    private Integer expCount; // Expert
    
    @NotNull(message = "La durée de l'évaluation est obligatoire")
    @Positive(message = "La durée doit être positive")
    private Double evaluationDurationDays; // Durée en H/j
    
    private String details; // Notes/détails supplémentaires
}
