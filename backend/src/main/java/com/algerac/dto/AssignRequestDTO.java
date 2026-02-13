package com.algerac.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignRequestDTO {
    
    @NotNull(message = "L'ID du RA est requis")
    private Long raId;
}
