package com.algerac.service;

import com.algerac.model.*;
import com.algerac.repository.DomainDevelopmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;

/**
 * PRO_17 : Service de gestion du développement de nouveaux domaines d'activité d'accréditation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DomainDevelopmentService {

    private final DomainDevelopmentRepository domainDevRepository;

    /**
     * Soumettre une demande de développement de domaine
     */
    @Transactional
    public DomainDevelopmentRequest submitRequest(String domainName, String description,
            String regulatoryBasis, String marketDemand, String applicableStandards,
            User currentUser) {

        String requestCode = "DOM-" + Year.now().getValue() + "-" +
                String.format("%04d", new Random().nextInt(9999));

        DomainDevelopmentRequest request = DomainDevelopmentRequest.builder()
                .requestCode(requestCode)
                .domainName(domainName)
                .description(description)
                .regulatoryBasis(regulatoryBasis)
                .marketDemand(marketDemand)
                .applicableStandards(applicableStandards)
                .status(DomainDevStatus.SUBMITTED)
                .requestedBy(currentUser)
                .build();

        request = domainDevRepository.save(request);
        log.info("Demande de développement de domaine {} soumise: {}", requestCode, domainName);
        return request;
    }

    /**
     * Lancer l'étude de faisabilité
     */
    @Transactional
    public DomainDevelopmentRequest startFeasibilityStudy(Long requestId, User currentUser) {
        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        if (request.getStatus() != DomainDevStatus.SUBMITTED) {
            throw new RuntimeException("La demande n'est pas dans un état permettant l'étude");
        }
        request.setStatus(DomainDevStatus.FEASIBILITY_STUDY);
        request = domainDevRepository.save(request);
        log.info("Étude de faisabilité démarrée pour le domaine {}", request.getDomainName());
        return request;
    }

    /**
     * Soumettre les résultats de l'étude de faisabilité
     */
    @Transactional
    public DomainDevelopmentRequest completeFeasibility(Long requestId, String feasibilityStudy,
            Boolean evaluatorsAvailable, Integer evaluatorCount, String trainingPlan,
            String resourceRequirements, User currentUser) {

        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        request.setFeasibilityStudy(feasibilityStudy);
        request.setCompetentEvaluatorsAvailable(evaluatorsAvailable);
        request.setEstimatedEvaluatorCount(evaluatorCount);
        request.setTrainingPlan(trainingPlan);
        request.setResourceRequirements(resourceRequirements);
        request.setStatus(DomainDevStatus.FEASIBILITY_COMPLETED);
        request = domainDevRepository.save(request);
        log.info("Étude de faisabilité terminée pour {}", request.getDomainName());
        return request;
    }

    /**
     * Revue par la Direction Technique
     */
    @Transactional
    public DomainDevelopmentRequest dtReview(Long requestId, String reviewComments, User currentUser) {
        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        request.setReviewedBy(currentUser);
        request.setReviewComments(reviewComments);
        request.setReviewDate(LocalDateTime.now());
        request.setStatus(DomainDevStatus.PENDING_DG_APPROVAL);
        request = domainDevRepository.save(request);
        log.info("Revue DT terminée pour {}, transmis à la DG pour approbation", request.getDomainName());
        return request;
    }

    /**
     * Approbation par la DG
     */
    @Transactional
    public DomainDevelopmentRequest dgDecision(Long requestId, boolean approved,
            String comments, User currentUser) {
        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        if (request.getStatus() != DomainDevStatus.PENDING_DG_APPROVAL) {
            throw new RuntimeException("La demande n'est pas en attente d'approbation DG");
        }

        if (approved) {
            request.setStatus(DomainDevStatus.APPROVED);
            request.setApprovedBy(currentUser);
            request.setApprovalDate(LocalDateTime.now());
            log.info("Domaine {} approuvé par la DG", request.getDomainName());
        } else {
            request.setStatus(DomainDevStatus.REJECTED);
            request.setReviewComments(request.getReviewComments() + "\n[DG] " + comments);
            log.info("Domaine {} rejeté par la DG", request.getDomainName());
        }

        return domainDevRepository.save(request);
    }

    /**
     * Démarrer la mise en œuvre
     */
    @Transactional
    public DomainDevelopmentRequest startImplementation(Long requestId, String implementationNotes,
            User currentUser) {
        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        if (request.getStatus() != DomainDevStatus.APPROVED) {
            throw new RuntimeException("Le domaine doit être approuvé avant la mise en œuvre");
        }
        request.setStatus(DomainDevStatus.IMPLEMENTATION);
        request.setImplementationNotes(implementationNotes);
        request.setImplementationDate(LocalDateTime.now());
        request = domainDevRepository.save(request);
        log.info("Mise en œuvre démarrée pour le domaine {}", request.getDomainName());
        return request;
    }

    /**
     * Activer le domaine
     */
    @Transactional
    public DomainDevelopmentRequest activateDomain(Long requestId, User currentUser) {
        DomainDevelopmentRequest request = getRequestOrThrow(requestId);
        if (request.getStatus() != DomainDevStatus.IMPLEMENTATION) {
            throw new RuntimeException("Le domaine doit être en cours de mise en œuvre");
        }
        request.setStatus(DomainDevStatus.ACTIVE);
        request = domainDevRepository.save(request);
        log.info("Domaine {} activé", request.getDomainName());
        return request;
    }

    public List<DomainDevelopmentRequest> getAllRequests() {
        return domainDevRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<DomainDevelopmentRequest> getByStatus(DomainDevStatus status) {
        return domainDevRepository.findByStatus(status);
    }

    private DomainDevelopmentRequest getRequestOrThrow(Long id) {
        return domainDevRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de développement non trouvée: " + id));
    }
}
