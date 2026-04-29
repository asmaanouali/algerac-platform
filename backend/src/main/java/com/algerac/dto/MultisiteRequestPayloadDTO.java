package com.algerac.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload multisites attaché à une demande d'accréditation (PRO 26).
 * Reçue dans NewRequestDTO.multisite quand l'OEC déclare son organisation
 * comme multisites au moment du dépôt de la demande.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultisiteRequestPayloadDTO {

    private String mainSiteName;
    private String mainSiteAddress;
    private String mainSiteContactName;
    private String mainSiteContactEmail;

    private Boolean centralizedManagementSystem;
    private String managementSystemDescription;
    private String interSiteExchangesDoc;

    /** JSON sérialisé des 6 critères §5.1 : {"legalLink":{"checked":true,"justification":"..."}, ...} */
    private String qualificationCriteriaJson;

    private List<SatelliteSiteInputDTO> satelliteSites;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SatelliteSiteInputDTO {
        private String name;
        private String address;
        private String activities;
        private String personnel;
        private Boolean isInScope;
    }
}
