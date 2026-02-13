package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.CreateConventionDTO;
import com.algerac.model.Convention;
import com.algerac.model.User;
import com.algerac.repository.UserRepository;
import com.algerac.service.ConventionService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conventions")
@RequiredArgsConstructor
public class ConventionController {
    
    private final ConventionService conventionService;
    private final UserRepository userRepository;
    
    /**
     * RA: Créer une nouvelle convention
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createConvention(
            @Valid @RequestBody CreateConventionDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Convention convention = conventionService.createConvention(
                    dto.getRequestId(),
                    dto.getContent(),
                    dto.getTermsAndConditions(),
                    currentUser
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Convention créée avec succès",
                    convention
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Envoyer la convention à l'OEC
     */
    @PostMapping("/{id}/send-to-oec")
    public ResponseEntity<ApiResponse> sendConventionToOEC(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Convention convention = conventionService.sendConventionToOEC(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Convention envoyée à l'OEC",
                    convention
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Valider la convention
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse> validateConventionByOEC(
            @PathVariable Long id,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Convention convention = conventionService.validateConventionByOEC(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Convention validée avec succès",
                    convention
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Obtenir les conventions pour une demande
     */
    @GetMapping("/by-request/{requestId}")
    public ResponseEntity<List<Convention>> getConventionsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(conventionService.getConventionsByRequest(requestId));
    }
    
    /**
     * OEC: Obtenir les conventions en attente de validation
     */
    @GetMapping("/pending-validation")
    public ResponseEntity<List<Convention>> getPendingOECValidationConventions() {
        return ResponseEntity.ok(conventionService.getPendingOECValidationConventions());
    }
    
    /**
     * RA: Obtenir mes conventions
     */
    @GetMapping("/my-conventions")
    public ResponseEntity<?> getMyConventions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        List<Convention> conventions = conventionService.getConventionsByRA(userId);
        return ResponseEntity.ok(conventions);
    }
}
