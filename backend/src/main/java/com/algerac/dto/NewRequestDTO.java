package com.algerac.dto;

import com.algerac.model.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewRequestDTO {
    
    @NotNull(message = "Le type de demande est requis")
    private RequestType type;
    
    @NotBlank(message = "Le domaine est requis")
    private String domain;
    
    private String description; // Description détaillée de la demande
}
