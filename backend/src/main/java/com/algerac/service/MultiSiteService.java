package com.algerac.service;

import com.algerac.dto.MultiSiteDTO;
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
import java.util.stream.Collectors;

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
     * Créer une configuration multi-site pour une demande (PRO_26 §5.2)
     */
    @Transactional
    public MultiSiteDTO createConfig(Long requestId, String mainSiteName, String mainSiteAddress,
            String mainSiteContact, String mainSiteEmail, Boolean centralizedSystem,
            String managementSystemDesc, Integer totalSatellites, String satelliteSitesJson,
            String siteSelectionCriteria, User currentUser) {

        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée: " + requestId));

        String configCode = "MULTI-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        int n = (totalSatellites != null && totalSatellites > 0) ? totalSatellites : 0;

        // PRO_26 §5.3.2-a: Initial — tous les sites sont évalués sans exception
        int sitesInitial = calculateInitialSiteSample(n);
        // PRO_26 §5.6 + PRO_13-1: Surveillance — formule √n
        int sitesAnnual = calculateSurveillanceSiteSample(n);

        MultiSiteConfig config = MultiSiteConfig.builder()
                .request(request)
                .configCode(configCode)
                .mainSiteName(mainSiteName)
                .mainSiteAddress(mainSiteAddress)
                .mainSiteContactName(mainSiteContact)
                .mainSiteContactEmail(mainSiteEmail)
                .centralizedManagementSystem(centralizedSystem)
                .managementSystemDescription(managementSystemDesc)
                .totalSatelliteSites(n)
                .satelliteSites(satelliteSitesJson)
                .sitesToEvaluateInitial(sitesInitial)
                .sitesToEvaluateAnnual(sitesAnnual)
                .siteSelectionCriteria(siteSelectionCriteria)
                .cycleDurationYears(4) // Cycle standard 4 ans (PRO_26)
                .status(MultiSiteStatus.DRAFT)
                .build();

        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} créée pour la demande {}", configCode, request.getReferenceNumber());
        return MultiSiteDTO.fromEntity(config);
    }

    /**
     * Mettre à jour une configuration (sites satellites, findings, etc.)
     */
    @Transactional
    public MultiSiteDTO updateConfig(Long configId, String mainSiteName, String mainSiteAddress,
            String mainSiteContact, String mainSiteEmail, Boolean centralizedSystem,
            String managementSystemDesc, Integer totalSatellites, String satelliteSitesJson,
            String siteSelectionCriteria, String siteSamplingJustification,
            String evaluationSchedule, String evaluationFindings, User currentUser) {

        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() == MultiSiteStatus.ACTIVE || config.getStatus() == MultiSiteStatus.ARCHIVED) {
            throw new RuntimeException("Impossible de modifier une configuration ACTIVE ou ARCHIVÉE");
        }

        int n = (totalSatellites != null && totalSatellites > 0) ? totalSatellites : 0;

        config.setMainSiteName(mainSiteName);
        config.setMainSiteAddress(mainSiteAddress);
        config.setMainSiteContactName(mainSiteContact);
        config.setMainSiteContactEmail(mainSiteEmail);
        config.setCentralizedManagementSystem(centralizedSystem);
        config.setManagementSystemDescription(managementSystemDesc);
        config.setTotalSatelliteSites(n);
        config.setSatelliteSites(satelliteSitesJson);
        config.setSitesToEvaluateInitial(calculateInitialSiteSample(n));
        config.setSitesToEvaluateAnnual(calculateSurveillanceSiteSample(n));
        config.setSiteSelectionCriteria(siteSelectionCriteria);
        config.setSiteSamplingJustification(siteSamplingJustification);
        config.setEvaluationSchedule(evaluationSchedule);
        config.setEvaluationFindings(evaluationFindings);
        // Reset to DRAFT if changes_requested
        if (config.getStatus() == MultiSiteStatus.CHANGES_REQUESTED) {
            config.setStatus(MultiSiteStatus.DRAFT);
        }

        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} mise à jour", config.getConfigCode());
        return MultiSiteDTO.fromEntity(config);
    }

    /**
     * Soumettre au CD pour revue (DRAFT → SUBMITTED)
     */
    @Transactional
    public MultiSiteDTO submitForValidation(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() != MultiSiteStatus.DRAFT && config.getStatus() != MultiSiteStatus.CHANGES_REQUESTED) {
            throw new RuntimeException("Seules les configurations en brouillon ou modifications demandées peuvent être soumises");
        }
        config.setStatus(MultiSiteStatus.SUBMITTED);
        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} soumise pour validation par {}", config.getConfigCode(), currentUser.getEmail());
        return MultiSiteDTO.fromEntity(config);
    }

    /**
     * CD prend en charge la revue (SUBMITTED → CD_REVIEW)
     */
    @Transactional
    public MultiSiteDTO startCdReview(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() != MultiSiteStatus.SUBMITTED) {
            throw new RuntimeException("La configuration doit être soumise pour démarrer la revue CD");
        }
        config.setStatus(MultiSiteStatus.CD_REVIEW);
        config = multiSiteRepository.save(config);
        log.info("Revue CD démarrée sur la configuration multi-site {} par {}", config.getConfigCode(), currentUser.getEmail());
        return MultiSiteDTO.fromEntity(config);
    }

    /**
     * CD valide ou demande des modifications (CD_REVIEW → VALIDATED | CHANGES_REQUESTED)
     * Correspond à la revue de recevabilité §5.2.1
     */
    @Transactional
    public MultiSiteDTO cdDecide(Long configId, boolean approved, String comments, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() != MultiSiteStatus.CD_REVIEW && config.getStatus() != MultiSiteStatus.SUBMITTED) {
            throw new RuntimeException("La configuration doit être en revue CD pour prendre une décision");
        }

        if (approved) {
            config.setStatus(MultiSiteStatus.VALIDATED);
            config.setValidatedBy(currentUser);
            config.setValidationDate(LocalDateTime.now());
            config.setValidationComments(comments);
            log.info("Configuration multi-site {} validée par le CD {}", config.getConfigCode(), currentUser.getEmail());
        } else {
            config.setStatus(MultiSiteStatus.CHANGES_REQUESTED);
            config.setValidationComments(comments);
            log.warn("Modifications demandées par le CD sur la config multi-site {}: {}", config.getConfigCode(), comments);
        }

        return MultiSiteDTO.fromEntity(multiSiteRepository.save(config));
    }

    /**
     * Activer la configuration (VALIDATED → ACTIVE)
     */
    @Transactional
    public MultiSiteDTO activate(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        if (config.getStatus() != MultiSiteStatus.VALIDATED) {
            throw new RuntimeException("La configuration doit être validée avant activation");
        }
        config.setStatus(MultiSiteStatus.ACTIVE);
        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} activée par {}", config.getConfigCode(), currentUser.getEmail());
        return MultiSiteDTO.fromEntity(config);
    }

    /**
     * Archiver la configuration
     */
    @Transactional
    public MultiSiteDTO archive(Long configId, User currentUser) {
        MultiSiteConfig config = getConfigOrThrow(configId);
        config.setStatus(MultiSiteStatus.ARCHIVED);
        config = multiSiteRepository.save(config);
        log.info("Configuration multi-site {} archivée par {}", config.getConfigCode(), currentUser.getEmail());
        return MultiSiteDTO.fromEntity(config);
    }

    public MultiSiteDTO getById(Long id) {
        return MultiSiteDTO.fromEntity(getConfigOrThrow(id));
    }

    public List<MultiSiteDTO> getByRequest(Long requestId) {
        return multiSiteRepository.findByRequest_Id(requestId)
                .stream().map(MultiSiteDTO::fromEntity).collect(Collectors.toList());
    }

    public List<MultiSiteDTO> getAll() {
        return multiSiteRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(MultiSiteDTO::fromEntity).collect(Collectors.toList());
    }

    public List<MultiSiteDTO> getByStatus(MultiSiteStatus status) {
        return multiSiteRepository.findByStatus(status)
                .stream().map(MultiSiteDTO::fromEntity).collect(Collectors.toList());
    }

    /**
     * PRO_26 §5.3.2-a : Évaluation initiale = TOUS les sites (siège + tous les satellites).
     * Aucun échantillonnage à l'évaluation initiale.
     */
    private int calculateInitialSiteSample(int totalSatellites) {
        return totalSatellites + 1; // Siège central + tous les sites satellites
    }

    /**
     * PRO_26 §5.6 + PRO_13-1 : Surveillance — formule √n.
     * Échantillon annuel = siège central + ⌈√n⌉ sites satellites.
     */
    private int calculateSurveillanceSiteSample(int totalSatellites) {
        if (totalSatellites == 0) return 1; // Siège seulement
        return 1 + (int) Math.ceil(Math.sqrt(totalSatellites));
    }

    private MultiSiteConfig getConfigOrThrow(Long id) {
        return multiSiteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Configuration multi-site non trouvée: " + id));
    }
}
