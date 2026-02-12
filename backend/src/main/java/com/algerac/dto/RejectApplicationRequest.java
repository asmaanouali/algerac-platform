package com.algerac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RejectApplicationRequest {
    
    @NotBlank(message = "Le motif de refus est obligatoire")
    private String rejectionReason;
}
