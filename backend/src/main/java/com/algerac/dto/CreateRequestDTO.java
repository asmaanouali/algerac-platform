package com.algerac.dto;

import com.algerac.model.RequestStatus;
import com.algerac.model.RequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRequestDTO {
    
    @NotNull(message = "Le type de demande est requis")
    private RequestType type;
    
    @NotBlank(message = "Le domaine est requis")
    private String domain;
    
    private RequestStatus status;
    private Integer progress;
    private Long oecId; // Optional, will be set from session if not provided
}
