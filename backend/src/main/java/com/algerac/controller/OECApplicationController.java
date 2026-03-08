package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.OECApplicationDTO;
import com.algerac.dto.RejectApplicationRequest;
import com.algerac.model.OECApplication;
import com.algerac.service.OECApplicationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/oec-applications")
@RequiredArgsConstructor
@Slf4j
public class OECApplicationController {
    
    private final OECApplicationService oecApplicationService;
    
    /**
     * Récupérer toutes les candidatures OEC (pour le DT)
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllApplications(HttpSession session) {
        // Vérifier l'authentification
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getAllApplicationsForDT();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Récupérer les candidatures en attente (pour le DT)
     */
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingApplications(HttpSession session) {
        // Vérifier l'authentification
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getPendingApplicationsForDT();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures en attente", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Récupérer une candidature par ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(@PathVariable Long id, HttpSession session) {
        // Vérifier l'authentification
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            OECApplication application = oecApplicationService.getApplicationById(id);
            return ResponseEntity.ok(application);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la récupération de la candidature {}", id, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la récupération de la candidature {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    /**
     * Approuver une candidature OEC (par le DT)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveApplication(
            @PathVariable Long id, 
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            oecApplicationService.approveApplication(id, userId);
            log.info("Candidature OEC {} approuvée par l'utilisateur {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("La candidature a été approuvée. Une notification a été envoyée à l'administrateur.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors de l'approbation de la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'approbation de la candidature {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    /**
     * Rejeter une candidature OEC (par le DT) avec motif
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectApplication(
            @PathVariable Long id,
            @Valid @RequestBody RejectApplicationRequest request,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            oecApplicationService.rejectApplication(
                    id, 
                    request.getRejectionReason(),
                    request.getManquements(),
                    userId
            );
            log.info("Candidature OEC {} rejetée par l'utilisateur {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("La candidature a été rejetée. Une notification a été envoyée au candidat et l'enregistrement a été supprimé.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet de la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors du rejet de la candidature {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    /**
     * Récupérer les candidatures approuvées en attente de création de compte (pour l'Admin)
     */
    @GetMapping("/approved-for-admin")
    public ResponseEntity<?> getApprovedApplicationsForAdmin(HttpSession session) {
        // Vérifier l'authentification
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getApprovedApplicationsForAdmin();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures approuvées", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Marquer une candidature comme compte créé (par l'Admin)
     */
    @PostMapping("/{id}/mark-account-created")
    public ResponseEntity<ApiResponse> markAsAccountCreated(
            @PathVariable Long id,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            oecApplicationService.markAsAccountCreated(id, userId);
            log.info("Compte créé pour la candidature OEC {} par l'admin {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("Le compte a été marqué comme créé.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors du marquage de la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors du marquage de la candidature {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    // ===================================================================
    // DAG ENDPOINTS - Fixation frais de dépôt & Vérification paiement
    // ===================================================================
    
    /**
     * Récupérer les candidatures en attente de fixation des frais (pour le DAG)
     */
    @GetMapping("/dag/awaiting-fee")
    public ResponseEntity<?> getApplicationsAwaitingFee(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getApplicationsAwaitingFee();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures en attente de frais", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Récupérer les candidatures en attente de vérification de paiement (pour le DAG)
     */
    @GetMapping("/dag/awaiting-payment")
    public ResponseEntity<?> getApplicationsAwaitingPayment(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getApplicationsAwaitingPaymentVerification();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures en attente de paiement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Récupérer toutes les candidatures gérées par le DAG
     */
    @GetMapping("/dag/all")
    public ResponseEntity<?> getAllApplicationsForDAG(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        try {
            List<OECApplicationDTO> applications = oecApplicationService.getAllApplicationsForDAG();
            return ResponseEntity.ok(applications);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des candidatures DAG", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DAG fixe les frais de dépôt
     */
    @PostMapping("/{id}/set-deposit-fee")
    public ResponseEntity<ApiResponse> setDepositFee(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            Object amountObj = request.get("amount");
            if (amountObj == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Le montant est obligatoire"));
            }
            BigDecimal amount = new BigDecimal(amountObj.toString());
            
            oecApplicationService.setDepositFee(id, amount, userId);
            log.info("Frais de dépôt fixés pour la candidature OEC {} par le DAG {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("Les frais de dépôt ont été fixés. L'OEC a été notifié par email.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors de la fixation des frais pour la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la fixation des frais", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    /**
     * DAG vérifie le paiement de l'OEC
     */
    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<ApiResponse> verifyPayment(
            @PathVariable Long id,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            oecApplicationService.verifyPayment(id, userId);
            log.info("Paiement vérifié pour la candidature OEC {} par le DAG {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("Le paiement a été vérifié. L'administrateur a été notifié pour créer le compte.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors de la vérification du paiement pour la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de la vérification du paiement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
    
    /**
     * DAG rejette une candidature pour non-paiement (délai dépassé)
     */
    @PostMapping("/{id}/reject-non-payment")
    public ResponseEntity<ApiResponse> rejectForNonPayment(
            @PathVariable Long id,
            HttpSession session) {
        
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        try {
            oecApplicationService.rejectForNonPayment(id, userId);
            log.info("Candidature OEC {} rejetée pour non-paiement par le DAG {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("La candidature a été rejetée pour non-paiement. L'OEC a été notifié.")
            );
        } catch (RuntimeException e) {
            log.error("Erreur lors du rejet pour non-paiement de la candidature {}", id, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("Erreur inattendue lors du rejet pour non-paiement", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Une erreur est survenue"));
        }
    }
}
