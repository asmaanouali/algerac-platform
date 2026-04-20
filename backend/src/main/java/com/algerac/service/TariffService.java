package com.algerac.service;


import com.algerac.model.*;
import com.algerac.repository.TariffGridRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * PRO_18 / PRO_18-1 : Service de gestion des tarifs et frais d'accrÃ©ditation
 * pour les OEC nationaux et Ã©trangers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TariffService {

    private final TariffGridRepository tariffGridRepository;

    /**
     * CrÃ©er une nouvelle grille tarifaire (tous les champs PRO_18/PRO_18-1)
     */
    @Transactional
    public TariffGrid createTariffGrid(String name, TariffCategory category,
            Boolean forNational, Boolean forForeign, String domain, String oecType,
            BigDecimal registrationFee, BigDecimal evalFeePerDay, BigDecimal docReviewFee,
            BigDecimal surveillanceFee, BigDecimal renewalFee, BigDecimal extensionFee,
            BigDecimal travelSupplement, BigDecimal adminFee,
            BigDecimal annualFee, BigDecimal certificateDeliveryFee,
            BigDecimal certificateModificationFee, BigDecimal certificateTranslationFee,
            BigDecimal suspensionLiftFee, BigDecimal transferFlatRate,
            BigDecimal multiSiteAdditionalSiteFee,
            Integer paymentTermDaysEvaluation, Integer paymentTermDaysAnnual,
            String currency,
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
                .annualFee(annualFee)
                .certificateDeliveryFee(certificateDeliveryFee)
                .certificateModificationFee(certificateModificationFee)
                .certificateTranslationFee(certificateTranslationFee)
                .suspensionLiftFee(suspensionLiftFee)
                .transferFlatRate(transferFlatRate)
                .multiSiteAdditionalSiteFee(multiSiteAdditionalSiteFee)
                .paymentTermDaysEvaluation(paymentTermDaysEvaluation != null ? paymentTermDaysEvaluation : 20)
                .paymentTermDaysAnnual(paymentTermDaysAnnual != null ? paymentTermDaysAnnual : 60)
                .currency(currency != null ? currency : (Boolean.TRUE.equals(forForeign) ? "EUR" : "DZD"))
                .standardEvaluationDaysMin(minDays)
                .standardEvaluationDaysMax(maxDays)
                .effectiveDate(effectiveDate)
                .notes(notes)
                .status(TariffStatus.DRAFT)
                .build();

        grid = tariffGridRepository.save(grid);
        log.info("Grille tarifaire {} crÃ©Ã©e: {}", tariffCode, name);
        return grid;
    }

    /**
     * Modifier une grille tarifaire existante (seulement si DRAFT)
     */
    @Transactional
    public TariffGrid updateTariffGrid(Long tariffId, Map<String, Object> fields) {
        TariffGrid grid = getTariffOrThrow(tariffId);
        if (grid.getStatus() == TariffStatus.ACTIVE) {
            throw new RuntimeException("Un tarif actif ne peut pas Ãªtre modifiÃ© directement. CrÃ©ez une nouvelle version.");
        }
        if (fields.containsKey("name")) grid.setName((String) fields.get("name"));
        if (fields.containsKey("notes")) grid.setNotes((String) fields.get("notes"));
        if (fields.containsKey("registrationFee") && fields.get("registrationFee") != null)
            grid.setRegistrationFee(new BigDecimal(fields.get("registrationFee").toString()));
        if (fields.containsKey("evalFeePerDay") && fields.get("evalFeePerDay") != null)
            grid.setEvaluationFeePerDay(new BigDecimal(fields.get("evalFeePerDay").toString()));
        if (fields.containsKey("docReviewFee") && fields.get("docReviewFee") != null)
            grid.setDocumentReviewFee(new BigDecimal(fields.get("docReviewFee").toString()));
        if (fields.containsKey("surveillanceFee") && fields.get("surveillanceFee") != null)
            grid.setSurveillanceFee(new BigDecimal(fields.get("surveillanceFee").toString()));
        if (fields.containsKey("renewalFee") && fields.get("renewalFee") != null)
            grid.setRenewalFee(new BigDecimal(fields.get("renewalFee").toString()));
        if (fields.containsKey("extensionFee") && fields.get("extensionFee") != null)
            grid.setExtensionFee(new BigDecimal(fields.get("extensionFee").toString()));
        if (fields.containsKey("travelSupplement") && fields.get("travelSupplement") != null)
            grid.setTravelSupplement(new BigDecimal(fields.get("travelSupplement").toString()));
        if (fields.containsKey("adminFee") && fields.get("adminFee") != null)
            grid.setAdministrativeFee(new BigDecimal(fields.get("adminFee").toString()));
        if (fields.containsKey("annualFee") && fields.get("annualFee") != null)
            grid.setAnnualFee(new BigDecimal(fields.get("annualFee").toString()));
        if (fields.containsKey("certificateDeliveryFee") && fields.get("certificateDeliveryFee") != null)
            grid.setCertificateDeliveryFee(new BigDecimal(fields.get("certificateDeliveryFee").toString()));
        if (fields.containsKey("certificateModificationFee") && fields.get("certificateModificationFee") != null)
            grid.setCertificateModificationFee(new BigDecimal(fields.get("certificateModificationFee").toString()));
        if (fields.containsKey("certificateTranslationFee") && fields.get("certificateTranslationFee") != null)
            grid.setCertificateTranslationFee(new BigDecimal(fields.get("certificateTranslationFee").toString()));
        if (fields.containsKey("suspensionLiftFee") && fields.get("suspensionLiftFee") != null)
            grid.setSuspensionLiftFee(new BigDecimal(fields.get("suspensionLiftFee").toString()));
        if (fields.containsKey("transferFlatRate") && fields.get("transferFlatRate") != null)
            grid.setTransferFlatRate(new BigDecimal(fields.get("transferFlatRate").toString()));
        if (fields.containsKey("multiSiteAdditionalSiteFee") && fields.get("multiSiteAdditionalSiteFee") != null)
            grid.setMultiSiteAdditionalSiteFee(new BigDecimal(fields.get("multiSiteAdditionalSiteFee").toString()));
        if (fields.containsKey("currency")) grid.setCurrency((String) fields.get("currency"));
        return tariffGridRepository.save(grid);
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
        log.info("Grille tarifaire {} activÃ©e", grid.getTariffCode());
        return grid;
    }

    /**
     * Archiver une grille tarifaire
     */
    @Transactional
    public TariffGrid archiveTariff(Long tariffId) {
        TariffGrid grid = getTariffOrThrow(tariffId);
        grid.setStatus(TariffStatus.ARCHIVED);
        grid = tariffGridRepository.save(grid);
        log.info("Grille tarifaire {} archivÃ©e", grid.getTariffCode());
        return grid;
    }

    /**
     * PRO_18 Â§5.5 / Â§5.17 : Calculer la redevance annuelle proratÃ©e.
     * Formule : (annualFee / 12) Ã— M  oÃ¹ M = nb de mois entiers entre date d'effet et fin d'annÃ©e.
     * @param annualFee  Montant annuel de base
     * @param effectiveMonth  Mois d'entrÃ©e en vigueur de l'accrÃ©ditation (1=janvier â€¦ 12=dÃ©cembre)
     * @return montant proratÃ©
     */
    public BigDecimal calculateAnnualFeeProrated(BigDecimal annualFee, int effectiveMonth) {
        if (annualFee == null || annualFee.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("La redevance annuelle doit Ãªtre positive");
        }
        if (effectiveMonth < 1 || effectiveMonth > 12) {
            throw new RuntimeException("Le mois doit Ãªtre compris entre 1 et 12");
        }
        // M = nombre de mois entiers entre le mois de prise d'effet et la fin de l'annÃ©e
        int M = 13 - effectiveMonth; // ex: mois 4 (avril) â†’ M = 9
        BigDecimal monthly = annualFee.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
        BigDecimal prorated = monthly.multiply(BigDecimal.valueOf(M));
        log.info("Redevance annuelle proratÃ©e: ({}/12) Ã— {} = {}", annualFee, M, prorated);
        return prorated;
    }

    /**
     * PRO_18 Â§5.8 : Calcul combinÃ© Extension + Surveillance simultanÃ©e.
     * RÃ¨gle : frais Ã©quipe divisÃ©s 50% surveillance / 50% extension
     *         + frais analyse documentaire extension rÃ©duits de 30%.
     */
    public Map<String, BigDecimal> calculateExtensionWithSurveillance(
            BigDecimal evaluationFeeTotal,
            BigDecimal extensionDocReviewFee) {
        BigDecimal half = evaluationFeeTotal.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal reducedDocReview = extensionDocReviewFee
                .multiply(BigDecimal.valueOf(0.70))
                .setScale(2, RoundingMode.HALF_UP);  // 30% discount
        return Map.of(
            "surveillancePortion", half,
            "extensionPortion", half,
            "extensionDocReviewDiscounted", reducedDocReview,
            "totalExtension", half.add(reducedDocReview),
            "totalSurveillance", half
        );
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
                .orElseThrow(() -> new RuntimeException("Aucune grille tarifaire applicable trouvÃ©e"));

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
     * Calculer le montant total d'un devis pour un OEC Ã©tranger (inclut frais de dÃ©placement)
     */
    public BigDecimal calculateForeignQuotation(String domain, String oecType,
            TariffCategory category, int evaluationDays) {
        List<TariffGrid> grids = tariffGridRepository
                .findByApplicableDomainAndStatusAndForForeignOECTrue(domain, TariffStatus.ACTIVE);

        TariffGrid applicable = grids.stream()
                .filter(g -> g.getOecType().equals(oecType) && g.getCategory() == category)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Aucune grille tarifaire applicable trouvÃ©e"));

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
     * Expirer les grilles obsolÃ¨tes
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
        log.info("{} grilles tarifaires expirÃ©es", expired);
        return expired;
    }

    public TariffGrid getTariffById(Long id) {
        return getTariffOrThrow(id);
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
                .orElseThrow(() -> new RuntimeException("Grille tarifaire non trouvÃ©e: " + id));
    }
}
