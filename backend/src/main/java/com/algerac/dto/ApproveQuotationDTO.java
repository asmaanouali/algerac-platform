package com.algerac.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveQuotationDTO {
    private String comments;
    
    @NotNull(message = "Le montant du devis est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private BigDecimal amount; // Le DAG définit le montant du devis (sous-total HT principal)

    /**
     * Détail HT par ligne du devis estimatif (FOR 44 / 44-1 / 44-2).
     * Les clés dépendent du type de demande (initial/renouvellement, surveillance, extension).
     */
    private Map<String, BigDecimal> breakdown;

    /**
     * Feuille éditable saisie par le DAG (colonnes + lignes).
     * Persistée avec le breakdown dans devisBreakdownJson.
     */
    private Map<String, Object> sheet;

    private String devisEstimatifNumber;
    private LocalDate devisEstimatifDate;
    private String siteName;
    private String siteAddress;
}
