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
public class ApproveQuotationDTO {
    private String comments;
    
    @NotNull(message = "Le montant du devis est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private BigDecimal amount; // Le DAG définit le montant du devis
}
