package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.ConventionRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConventionService {
    
    private final ConventionRepository conventionRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    
    /**
     * Créer une nouvelle convention par le RA
     */
    @Transactional
    public Convention createConvention(Long requestId, String content, String termsAndConditions, User currentUser) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        if (request.getAssignedToRa() != null &&
                !request.getAssignedToRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à créer une convention pour cette demande");
        }
        
        if (request.getStatus() != RequestStatus.RECEIVABLE && 
            request.getStatus() != RequestStatus.QUOTATION_PREPARATION) {
            throw new RuntimeException("La demande doit être recevable pour créer une convention. Statut actuel : " + request.getStatus());
        }
        
        String conventionNumber = generateConventionNumber();
        
        Convention convention = Convention.builder()
                .request(request)
                .conventionNumber(conventionNumber)
                .preparedByRa(currentUser)
                .status(ConventionStatus.DRAFT)
                .content(content)
                .termsAndConditions(termsAndConditions)
                .createdAt(LocalDateTime.now())
                .build();
        
        convention = conventionRepository.save(convention);
        
        log.info("Convention {} créée pour la demande {} par {}", 
                conventionNumber, request.getReferenceNumber(), currentUser.getFullName());
        
        return convention;
    }
    
    /**
     * Envoyer la convention à l'OEC (généralement avec le devis)
     */
    @Transactional
    public Convention sendConventionToOEC(Long conventionId, User currentUser) {
        Convention convention = conventionRepository.findById(conventionId)
                .orElseThrow(() -> new RuntimeException("Convention non trouvée"));
        
        if (convention.getPreparedByRa() != null &&
                !convention.getPreparedByRa().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à envoyer cette convention");
        }
        
        if (convention.getStatus() != ConventionStatus.DRAFT) {
            throw new RuntimeException("Cette convention a déjà été envoyée");
        }
        
        convention.setStatus(ConventionStatus.SENT_TO_OEC);
        convention.setSentToOecDate(LocalDateTime.now());
        convention = conventionRepository.save(convention);
        
        log.info("Convention {} envoyée à l'OEC", convention.getConventionNumber());
        
        return convention;
    }
    
    /**
     * Valider la convention par l'OEC
     */
    @Transactional
    public Convention validateConventionByOEC(Long conventionId, User currentUser) {
        Convention convention = conventionRepository.findById(conventionId)
                .orElseThrow(() -> new RuntimeException("Convention non trouvée"));
        
        AccreditationRequest request = convention.getRequest();
        if (request.getOec() != null &&
                !request.getOec().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Vous n'êtes pas autorisé à valider cette convention");
        }
        
        if (convention.getStatus() != ConventionStatus.SENT_TO_OEC) {
            throw new RuntimeException("Cette convention n'est pas en attente de validation");
        }
        
        convention.setStatus(ConventionStatus.VALIDATED_BY_OEC);
        convention.setValidatedByOecDate(LocalDateTime.now());
        convention = conventionRepository.save(convention);
        
        log.info("Convention {} validée par l'OEC {}", 
                convention.getConventionNumber(), currentUser.getOrganizationName());
        
        return convention;
    }
    
    /**
     * Obtenir toutes les conventions pour une demande
     */
    public List<Convention> getConventionsByRequest(Long requestId) {
        return conventionRepository.findByRequest_Id(requestId);
    }
    
    /**
     * Obtenir les conventions préparées par un RA
     */
    public List<Convention> getConventionsByRA(Long raId) {
        return conventionRepository.findByPreparedByRa_Id(raId);
    }
    
    /**
     * Obtenir les conventions en attente de validation OEC
     */
    public List<Convention> getPendingOECValidationConventions() {
        return conventionRepository.findByStatus(ConventionStatus.SENT_TO_OEC);
    }
    
    /**
     * Générer un numéro de convention unique
     */
    private String generateConventionNumber() {
        String year = String.valueOf(Year.now().getValue());
        int counter = 1;
        String conventionNumber;
        
        do {
            conventionNumber = String.format("CONV-%s-%03d", year, counter);
            counter++;
        } while (conventionRepository.findByConventionNumber(conventionNumber).isPresent());
        
        return conventionNumber;
    }
}
