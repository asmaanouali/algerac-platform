package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.CreateQuotationDTO;
import com.algerac.dto.ApproveQuotationDTO;
import com.algerac.model.Quotation;
import com.algerac.model.User;
import com.algerac.repository.UserRepository;
import com.algerac.service.QuotationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationController {
    
    private final QuotationService quotationService;
    private final UserRepository userRepository;
    
    /**
     * RA: Créer un nouveau devis
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createQuotation(
            @Valid @RequestBody CreateQuotationDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Quotation quotation = quotationService.createQuotation(
                    dto.getRequestId(),
                    dto.getReeCount(),
                    dto.getEtCount(),
                    dto.getEqCount(),
                    dto.getObsCount(),
                    dto.getSupCount(),
                    dto.getExpCount(),
                    dto.getEvaluationDurationDays(),
                    dto.getDetails(),
                    currentUser
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Devis créé avec succès",
                    quotation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Envoyer le devis au DAG
     */
    @PostMapping("/{id}/send-to-dag")
    public ResponseEntity<ApiResponse> sendQuotationToDAG(
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
            
            Quotation quotation = quotationService.sendQuotationToDAG(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Devis envoyé au DAG pour approbation",
                    quotation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DAG: Approuver le devis
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveQuotationByDAG(
            @PathVariable Long id,
            @Valid @RequestBody ApproveQuotationDTO dto,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            Quotation quotation = quotationService.approveQuotationByDAG(
                    id,
                    dto.getAmount(),
                    dto.getComments(),
                    currentUser
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Devis approuvé avec succès",
                    quotation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Envoyer le devis à l'OEC
     */
    @PostMapping("/{id}/send-to-oec")
    public ResponseEntity<ApiResponse> sendQuotationToOEC(
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
            
            Quotation quotation = quotationService.sendQuotationToOEC(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Devis envoyé à l'OEC",
                    quotation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Valider le devis
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse> validateQuotationByOEC(
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
            
            Quotation quotation = quotationService.validateQuotationByOEC(id, currentUser);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Devis validé avec succès",
                    quotation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Obtenir les devis pour une demande
     */
    @GetMapping("/by-request/{requestId}")
    public ResponseEntity<List<Quotation>> getQuotationsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(quotationService.getQuotationsByRequest(requestId));
    }
    
    /**
     * DAG: Obtenir les devis en attente d'approbation
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<List<Quotation>> getPendingDAGApprovalQuotations() {
        return ResponseEntity.ok(quotationService.getPendingDAGApprovalQuotations());
    }
    
    /**
     * RA: Obtenir mes devis
     */
    @GetMapping("/my-quotations")
    public ResponseEntity<?> getMyQuotations(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Non authentifié"));
        }
        
        List<Quotation> quotations = quotationService.getQuotationsByRA(userId);
        return ResponseEntity.ok(quotations);
    }
}
