package com.algerac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OECApplicationDTO {
    private Long id;
    private String nomOrganisme;
    private String typeOrganisme;
    private String adresseSiege;
    private String telephone;
    private String email;
    private String nomRepresentant;
    private String fonction;
    private String porteeAccreditation;
    private String status;
    private String rejectionReason;
    private String manquements;
    private String createdAt;
    private String reviewedByDtAt;
    // DAG fields
    private BigDecimal depositFeeAmount;
    private String feeSetAt;
    private String paymentDeadline;
    private String paymentVerifiedAt;
}
