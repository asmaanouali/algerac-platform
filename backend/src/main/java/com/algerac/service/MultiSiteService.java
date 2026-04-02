package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.MultiSiteConfigRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_26 : Service de gestion de l'accréditation multi-sites.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MultiSiteService {

    private final MultiSiteConfigRepository multiSiteRepository;
    private final RequestRepository requestRepository;

    /**
     * Créer une configuration multi-site pour une demande
     */
    @Transactional
    public MultiSiteConfig createConfig(Long requestId, String mainSiteName, String mainSiteAddress,
            String mainSiteContact, String mainSiteEmail, Boolean centralizedSystem,
            String managementSystemDesc, Integer totalSatellites, String satelliteSitesJson,
            String siteSelectionCriteria, User currentUser) {

        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));

        String configCode = "MULTI-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        // Calcul du nombre de sites à évaluer selon PRO_26
        int sitesInitial = calculateInitialSiteSample(totalSatellites);
        int sitesAnnual = calculateAnnualSiteSample(totalSatellites);

        MultiSiteConfig config = MultiSiteConfig.builder()
                .request(request)
                .configCode(configCode)
                .mainSiteName(mainSiteName)
                .mainSiteAddress(mainSiteAddress)
                .mainSiteContactName(mainSiteContact)
                .mainSiteContactEmail(mainSiteEmail)
                .centralizedManagementSystem(centralizedSystem)
                .managementSystemDescription(managementSystemDesc)
                .totalSatelliteSites(totalSatellites)
                .satelliteSites(satelliteSitesJson)
                .sitesToEvaluateInitial(sitesInitial)
                .sitesToEvaluateAnnual(sitesAnnual)
                .siteSelectionCriteria(siteSelectionCriteria)
                .cycleDurationYears(4) // Cycle standard 4 ans
                .status(MultiSiteStatus.DRAFT)
                .build();

        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} créée pour la demande {}", configCode, request.getReferenceNumber());
        return config;
    }

    /**
     * Soumettre au CD pour validation
     */
    @Transactional
    public MultiSiteConfig submitForValidation(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        config.setStatus(MultiSiteStatus.SUBMITTED);
        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} soumise pour validation", config.getConfigCode());
        return config;
    }

    /**
     * CD valide la configuration multi-site
     */
    @Transactional
    public MultiSiteConfig cdValidate(Long configId, boolean approved, String comments,
            User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);

        if (approved) {
            config.setStatus(MultiSiteStatus.VALIDATED);
            config.setValidatedBy(currentUser);
            config.setValidationDate(LocalDateTime.now());
            config.setValidationComments(comments);
            log.info("Configuration multi-site {} validée par le CD", config.getConfigCode());
        } else {
            config.setStatus(MultiSiteStatus.CHANGES_REQUESTED);
            config.setValidationComments(comments);
            log.info("Modifications demandées sur la config multi-site {}", config.getConfigCode());
        }

        return multiSiteRepository.save(config);
    }

    /**
     * Activer la configuration
     */
    @Transactional
    public MultiSiteConfig activate(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() != MultiSiteStatus.VALIDATED) {
            throw new RuntimeException("La configuration doit être validée avant activation");
        }
        config.setStatus(MultiSiteStatus.ACTIVE);
        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} activée", config.getConfigCode());
        return config;
    }

    public List<MultiSiteConfig> getByRequest(Long requestId) {
        return multiSiteRepository.findByRequest_Id(requestId);
    }

    public List<MultiSiteConfig> getAll() {
        return multiSiteRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Calcul de l'échantillon initial selon PRO_26:
     * Site principal + racine carrée du nombre de sites satellites
     */
    private int calculateInitialSiteSample(int totalSatellites) {
        return 1 + (int) Math.ceil(Math.sqrt(totalSatellites));
    }

    /**
     * Calcul de l'échantillon annuel de surveillance (doit couvrir tous les sites sur le cycle)
     */
    private int calculateAnnualSiteSample(int totalSatellites) {
        int cycleDuration = 4; // 4 ans
        return Math.max(1, (int) Math.ceil((double) totalSatellites / cycleDuration));
    }

    private MultiSiteConfig getConfigOrThrow(Long id) {
        return multiSiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuration multi-site non trouvée: " + id));
    }
}
