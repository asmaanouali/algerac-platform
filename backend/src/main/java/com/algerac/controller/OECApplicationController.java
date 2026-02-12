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

import java.util.List;

@RestController
@RequestMapping("/api/oec-applications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
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
            OECApplication application = oecApplicationService.approveApplication(id, userId);
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
            OECApplication application = oecApplicationService.rejectApplication(
                    id, 
                    request.getRejectionReason(), 
                    userId
            );
            log.info("Candidature OEC {} rejetée par l'utilisateur {}", id, userId);
            return ResponseEntity.ok(
                    ApiResponse.success("La candidature a été rejetée. Une notification a été envoyée au candidat.")
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
            OECApplication application = oecApplicationService.markAsAccountCreated(id, userId);
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
}
