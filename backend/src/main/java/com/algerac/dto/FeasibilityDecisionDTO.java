package com.algerac.dto;

import com.algerac.model.FeasibilityDecision;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeasibilityDecisionDTO {
    
    @NotNull(message = "La décision est obligatoire")
    private FeasibilityDecision decision;
    
    private String comments;
    private String technicalAnalysis;
    private String complianceCheck;
    private String rejectionReason; // Obligatoire si decision = NOT_RECEIVABLE
}
