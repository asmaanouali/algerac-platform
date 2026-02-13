package com.algerac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateConventionDTO {
    
    @NotNull(message = "L'ID de la demande est obligatoire")
    private Long requestId;
    
    private String content;
    private String termsAndConditions;
}
