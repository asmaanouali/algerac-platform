package com.algerac.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceivabilityDecisionDTO {
    
    @NotNull(message = "La décision est requise")
    private Boolean isReceivable;
    
    @NotBlank(message = "Les commentaires sont requis")
    private String comments;
}
