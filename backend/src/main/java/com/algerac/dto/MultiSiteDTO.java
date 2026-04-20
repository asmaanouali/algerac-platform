package com.algerac.dto;

import com.algerac.model.MultiSiteConfig;
import com.algerac.model.MultiSiteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO pour PRO_26 — MultiSiteConfig.
 * Évite la sérialisation récursive des entités JPA.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiSiteDTO {

    private Long id;
    private String configCode;

    // Demande liée
    private Long requestId;
    private String requestReferenceNumber;
    private String oecName;

    // Site principal (siège central)
    private String mainSiteName;
    private String mainSiteAddress;
    private String mainSiteContactName;
    private String mainSiteContactEmail;

    // Système de management
    private Boolean centralizedManagementSystem;
    private String managementSystemDescription;

    // Sites satellites
    private Integer totalSatelliteSites;
    private String satelliteSites; // JSON

    // Plan d'échantillonnage PRO_26 / PRO_13-1
    private Integer sitesToEvaluateInitial;  // Tous les sites (initial)
    private Integer sitesToEvaluateAnnual;   // 1 + ⌈√n⌉ (surveillance)
    private String siteSelectionCriteria;
    private String siteSamplingJustification;

    // Calendrier & cycle
    private String evaluationSchedule;
    private Integer cycleDurationYears;

    // Résultats d'évaluation
    private String evaluationFindings;

    // Statut
    private MultiSiteStatus status;
    private String statusLabel;

    // Certificat
    private String certificateType; // "FOR_16_1" (EA) ou "FOR_16_3" (non-EA)

    // Validation CD
    private Long validatedById;
    private String validatedByName;
    private LocalDateTime validationDate;
    private String validationComments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MultiSiteDTO fromEntity(MultiSiteConfig c) {
        String oecName = null;
        String requestRef = null;
        if (c.getRequest() != null) {
            requestRef = c.getRequest().getReferenceNumber();
            if (c.getRequest().getOec() != null) {
                oecName = c.getRequest().getOec().getOrganizationName();
            }
        }

        String validatedByName = null;
        Long validatedById = null;
        if (c.getValidatedBy() != null) {
            validatedById = c.getValidatedBy().getId();
            validatedByName = c.getValidatedBy().getFullName() != null
                    ? c.getValidatedBy().getFullName()
                    : c.getValidatedBy().getPrenom() + " " + c.getValidatedBy().getNom();
        }

        return MultiSiteDTO.builder()
                .id(c.getId())
                .configCode(c.getConfigCode())
                .requestId(c.getRequest() != null ? c.getRequest().getId() : null)
                .requestReferenceNumber(requestRef)
                .oecName(oecName)
                .mainSiteName(c.getMainSiteName())
                .mainSiteAddress(c.getMainSiteAddress())
                .mainSiteContactName(c.getMainSiteContactName())
                .mainSiteContactEmail(c.getMainSiteContactEmail())
                .centralizedManagementSystem(c.getCentralizedManagementSystem())
                .managementSystemDescription(c.getManagementSystemDescription())
                .totalSatelliteSites(c.getTotalSatelliteSites())
                .satelliteSites(c.getSatelliteSites())
                .sitesToEvaluateInitial(c.getSitesToEvaluateInitial())
                .sitesToEvaluateAnnual(c.getSitesToEvaluateAnnual())
                .siteSelectionCriteria(c.getSiteSelectionCriteria())
                .siteSamplingJustification(c.getSiteSamplingJustification())
                .evaluationSchedule(c.getEvaluationSchedule())
                .cycleDurationYears(c.getCycleDurationYears())
                .evaluationFindings(c.getEvaluationFindings())
                .status(c.getStatus())
                .statusLabel(getStatusLabel(c.getStatus()))
                .validatedById(validatedById)
                .validatedByName(validatedByName)
                .validationDate(c.getValidationDate())
                .validationComments(c.getValidationComments())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private static String getStatusLabel(MultiSiteStatus status) {
        if (status == null) return "Inconnu";
        return switch (status) {
            case DRAFT -> "Brouillon";
            case SUBMITTED -> "Soumis";
            case CD_REVIEW -> "En revue CD";
            case VALIDATED -> "Validé";
            case CHANGES_REQUESTED -> "Modifications demandées";
            case ACTIVE -> "Actif";
            case ARCHIVED -> "Archivé";
        };
    }
}
