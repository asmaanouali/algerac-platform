package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service de surveillance des délais critiques.
 * Envoie des rappels et effectue les transitions automatiques quand les délais sont dépassés.
 *
 * Délais implémentés :
 * - Correction recevabilité OEC : 30 jours
 * - Validation devis OEC : 10 jours (basé sur sentToOecDate)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineEnforcementService {

    private final RequestRepository requestRepository;
    private final QuotationRepository quotationRepository;
    private final NotificationService notificationService;

    /**
     * Vérification toutes les heures des délais critiques
     */
    @Scheduled(fixedRate = 3600000) // every hour
    @Transactional
    public void checkDeadlines() {
        log.debug("Vérification des délais en cours...");
        checkReceivabilityCorrectionDeadlines();
        checkQuotationExpiry();
        log.debug("Vérification des délais terminée");
    }

    /**
     * Vérifie les demandes avec correction de recevabilité en cours dont le délai est dépassé (30 jours)
     */
    private void checkReceivabilityCorrectionDeadlines() {
        List<AccreditationRequest> requests = requestRepository.findByStatus(RequestStatus.RECEIVABILITY_CORRECTION);
        LocalDateTime now = LocalDateTime.now();
        for (AccreditationRequest request : requests) {
            if (request.getCorrectionDeadline() != null && request.getCorrectionDeadline().isBefore(now)) {
                log.warn("Délai de correction dépassé pour la demande {}", request.getReferenceNumber());
                request.setStatus(RequestStatus.NOT_RECEIVABLE);
                requestRepository.save(request);
                notificationService.createNotification(
                        request.getOec().getId(),
                        "Délai de correction expiré",
                        "Le délai de correction pour la demande " + request.getReferenceNumber() + " est dépassé.",
                        "DEADLINE_EXPIRED"
                );
            }
        }
    }

    /**
     * Vérifie les devis envoyés à l'OEC dont le délai de validation est dépassé (10 jours après envoi)
     */
    private void checkQuotationExpiry() {
        List<Quotation> sentQuotations = quotationRepository.findByStatus(QuotationStatus.SENT_TO_OEC);
        LocalDateTime now = LocalDateTime.now();
        for (Quotation quotation : sentQuotations) {
            if (quotation.getSentToOecDate() != null
                    && quotation.getSentToOecDate().plusDays(10).isBefore(now)) {
                log.warn("Devis expiré: {}", quotation.getQuotationNumber());
                quotation.setStatus(QuotationStatus.EXPIRED);
                quotationRepository.save(quotation);
                AccreditationRequest request = quotation.getRequest();
                if (request != null) {
                    request.setStatus(RequestStatus.QUOTATION_EXPIRED);
                    requestRepository.save(request);
                }
            }
        }
    }
}
