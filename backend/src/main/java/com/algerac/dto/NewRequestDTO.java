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

    /** PRO 26 : true si la demande concerne un OEC multisites. */
    private Boolean isMultisite;

    /** PRO 26 : payload multisites (siège, sites satellites, critères §5.1). */
    private MultisiteRequestPayloadDTO multisite;
}
