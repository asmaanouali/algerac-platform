package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.TariffGridRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_18 / PRO_18-1 : Service de gestion des tarifs et frais d'accréditation
 * pour les OEC nationaux et étrangers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TariffService {

    private final TariffGridRepository tariffGridRepository;

    /**
     * Créer une nouvelle grille tarifaire
     */
    @Transactional
    public TariffGrid createTariffGrid(String name, TariffCategory category,
            Boolean forNational, Boolean forForeign, String domain, String oecType,
            BigDecimal registrationFee, BigDecimal evalFeePerDay, BigDecimal docReviewFee,
            BigDecimal surveillanceFee, BigDecimal renewalFee, BigDecimal extensionFee,
            BigDecimal travelSupplement, BigDecimal adminFee,
            Integer minDays, Integer maxDays, LocalDateTime effectiveDate,
            String notes, User currentUser) {

        String tariffCode = "TAR-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        TariffGrid grid = TariffGrid.builder()
                .tariffCode(tariffCode)
                .name(name)
                .category(category)
                .forNationalOEC(forNational)
                .forForeignOEC(forForeign)
                .applicableDomain(domain)
                .oecType(oecType)
                .registrationFee(registrationFee)
                .evaluationFeePerDay(evalFeePerDay)
                .documentReviewFee(docReviewFee)
                .surveillanceFee(surveillanceFee)
                .renewalFee(renewalFee)
                .extensionFee(extensionFee)
                .travelSupplement(travelSupplement)
                .administrativeFee(adminFee)
                .standardEvaluationDaysMin(minDays)
                .standardEvaluationDaysMax(maxDays)
                .effectiveDate(effectiveDate)
                .notes(notes)
                .status(TariffStatus.DRAFT)
                .build();

        grid = tariffGridRepository.save(grid);
        log.info("Grille tarifaire {} créée: {}", tariffCode, name);
        return grid;
    }

    /**
     * Activer une grille tarifaire
     */
    @Transactional
    public TariffGrid activateTariff(Long tariffId, User currentUser) {
        TariffGrid grid = getTariffOrThrow(tariffId);
        grid.setStatus(TariffStatus.ACTIVE);
        grid.setApprovedBy(currentUser);
        grid.setApprovalDate(LocalDateTime.now());
        grid = tariffGridRepository.save(grid);
        log.info("Grille tarifaire {} activée", grid.getTariffCode());
        return grid;
    }

    /**
     * Calculer le montant total d'un devis pour un OEC national
     */
    public BigDecimal calculateNationalQuotation(String domain, String oecType,
            TariffCategory category, int evaluationDays) {
        List<TariffGrid> grids = tariffGridRepository
                .findByApplicableDomainAndStatusAndForNationalOECTrue(domain, TariffStatus.ACTIVE);

        TariffGrid applicable = grids.stream()
                .filter(g -> g.getOecType().equals(oecType) && g.getCategory() == category)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune grille tarifaire applicable trouvée"));

        BigDecimal total = applicable.getRegistrationFee();
        if (applicable.getEvaluationFeePerDay() != null) {
            total = total.add(applicable.getEvaluationFeePerDay()
                    .multiply(BigDecimal.valueOf(evaluationDays)));
        }
        if (applicable.getDocumentReviewFee() != null) {
            total = total.add(applicable.getDocumentReviewFee());
        }
        if (applicable.getAdministrativeFee() != null) {
            total = total.add(applicable.getAdministrativeFee());
        }
        return total;
    }

    /**
     * Calculer le montant total d'un devis pour un OEC étranger
     */
    public BigDecimal calculateForeignQuotation(String domain, String oecType,
            TariffCategory category, int evaluationDays) {
        List<TariffGrid> grids = tariffGridRepository
                .findByApplicableDomainAndStatusAndForForeignOECTrue(domain, TariffStatus.ACTIVE);

        TariffGrid applicable = grids.stream()
                .filter(g -> g.getOecType().equals(oecType) && g.getCategory() == category)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune grille tarifaire applicable trouvée"));

        BigDecimal total = applicable.getRegistrationFee();
        if (applicable.getEvaluationFeePerDay() != null) {
            total = total.add(applicable.getEvaluationFeePerDay()
                    .multiply(BigDecimal.valueOf(evaluationDays)));
        }
        if (applicable.getDocumentReviewFee() != null) {
            total = total.add(applicable.getDocumentReviewFee());
        }
        if (applicable.getTravelSupplement() != null) {
            total = total.add(applicable.getTravelSupplement());
        }
        if (applicable.getAdministrativeFee() != null) {
            total = total.add(applicable.getAdministrativeFee());
        }
        return total;
    }

    /**
     * Expirer les grilles obsolètes
     */
    @Transactional
    public int expireObsoleteTariffs() {
        List<TariffGrid> active = tariffGridRepository.findByStatus(TariffStatus.ACTIVE);
        int expired = 0;
        for (TariffGrid grid : active) {
            if (grid.getExpirationDate() != null &&
                    grid.getExpirationDate().isBefore(LocalDateTime.now())) {
                grid.setStatus(TariffStatus.EXPIRED);
                tariffGridRepository.save(grid);
                expired++;
            }
        }
        log.info("{} grilles tarifaires expirées", expired);
        return expired;
    }

    public List<TariffGrid> getAllTariffs() {
        return tariffGridRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<TariffGrid> getActiveTariffs() {
        return tariffGridRepository.findByStatus(TariffStatus.ACTIVE);
    }

    public List<TariffGrid> getNationalTariffs() {
        return tariffGridRepository.findByForNationalOECTrue();
    }

    public List<TariffGrid> getForeignTariffs() {
        return tariffGridRepository.findByForForeignOECTrue();
    }

    private TariffGrid getTariffOrThrow(Long id) {
        return tariffGridRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Grille tarifaire non trouvée: " + id));
    }
}
