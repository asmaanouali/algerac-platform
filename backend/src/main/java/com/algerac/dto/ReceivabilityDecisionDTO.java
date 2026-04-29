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

    /**
     * PRO 26 §5.2.1 : revue des 6 critères §5.1 par le RA pour les demandes multisites.
     * JSON : {"legalLink":{"verified":true,"comment":"…"}, "centralSM":{...}, ...}
     * Obligatoire si la demande est multisites.
     */
    private String multisiteCriteriaReviewJson;
}
