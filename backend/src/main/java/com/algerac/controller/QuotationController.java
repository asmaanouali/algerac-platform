package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.CreateQuotationDTO;
import com.algerac.dto.ApproveQuotationDTO;
import com.algerac.model.Quotation;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import com.algerac.service.QuotationService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
                    dto.getReeDurationDays(),
                    dto.getEtDurationDays(),
                    dto.getEqDurationDays(),
                    dto.getObsDurationDays(),
                    dto.getSupDurationDays(),
                    dto.getExpDurationDays(),
                    dto.getCdHelpRequested(),
                    dto.getCdHelpMessage(),
                    dto.getDetails(),
                    currentUser
            );
            
            return ResponseEntity.ok(ApiResponse.success("Devis créé avec succès", quotation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Envoyer le devis au DAG
     */
    @PostMapping("/{id}/send-to-dag")
    public ResponseEntity<ApiResponse> sendQuotationToDAG(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            Quotation quotation = quotationService.sendQuotationToDAG(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Devis envoyé au DAG pour approbation", quotation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DAG: Approuver le devis (fixer le montant)
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse> approveQuotationByDAG(
            @PathVariable Long id, @Valid @RequestBody ApproveQuotationDTO dto, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            Quotation quotation = quotationService.approveQuotationByDAG(id, dto.getAmount(), dto.getComments(), currentUser);
            return ResponseEntity.ok(ApiResponse.success("Devis approuvé avec succès", quotation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * RA: Demander la validation du CD (quand devis approuvé + convention prête)
     */
    @PostMapping("/request-cd-validation/{requestId}")
    public ResponseEntity<ApiResponse> requestCDValidation(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            quotationService.requestCDValidation(requestId, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Demande de validation envoyée au CD"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * CD: Valider et envoyer à l'OEC
     */
    @PostMapping("/cd-validate/{requestId}")
    public ResponseEntity<ApiResponse> cdValidate(@PathVariable Long requestId, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            quotationService.cdValidateAndSendToOEC(requestId, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Devis et convention validés et envoyés à l'OEC"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * CD: Demander des modifications au RA
     */
    @PostMapping("/cd-request-modifications/{requestId}")
    public ResponseEntity<ApiResponse> cdRequestModifications(
            @PathVariable Long requestId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            quotationService.cdRequestModifications(requestId, body.get("comments"), currentUser);
            return ResponseEntity.ok(ApiResponse.success("Modifications demandées au RA"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * CD: Contacter un expert par email
     */
    @PostMapping("/cd-contact-expert/{requestId}")
    public ResponseEntity<ApiResponse> cdContactExpert(
            @PathVariable Long requestId, @RequestBody Map<String, String> body, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            quotationService.cdContactExpert(requestId, body.get("expertEmail"), body.get("message"), currentUser);
            return ResponseEntity.ok(ApiResponse.success("Email envoyé à l'expert"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Valider le devis
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse> validateQuotationByOEC(@PathVariable Long id, HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
            User currentUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            Quotation quotation = quotationService.validateQuotationByOEC(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success("Devis validé avec succès", quotation));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Obtenir les devis pour une demande — masque le montant pour RA et CD
     */
    @GetMapping("/by-request/{requestId}")
    public ResponseEntity<?> getQuotationsByRequest(@PathVariable Long requestId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        User currentUser = userId != null ? userRepository.findById(userId).orElse(null) : null;
        
        List<Quotation> quotations = quotationService.getQuotationsByRequest(requestId);
        
        // Masquer le montant pour RA et CD
        if (currentUser != null && (currentUser.getRole() == UserRole.RA || currentUser.getRole() == UserRole.CD)) {
            return ResponseEntity.ok(quotations.stream().map(q -> sanitizeQuotationForRaCD(q)).collect(Collectors.toList()));
        }
        
        return ResponseEntity.ok(quotations);
    }
    
    /**
     * DAG: Obtenir les devis en attente d'approbation
     */
    @GetMapping("/pending-approval")
    public ResponseEntity<List<Quotation>> getPendingDAGApprovalQuotations() {
        return ResponseEntity.ok(quotationService.getPendingDAGApprovalQuotations());
    }
    
    /**
     * CD: Obtenir les devis en attente de validation CD
     */
    @GetMapping("/pending-cd-validation")
    public ResponseEntity<List<Quotation>> getPendingCDValidationQuotations() {
        return ResponseEntity.ok(quotationService.getPendingCDValidationQuotations());
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
    
    /**
     * Crée un map sans le montant pour les rôles RA/CD
     */
    private Map<String, Object> sanitizeQuotationForRaCD(Quotation q) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", q.getId());
        map.put("quotationNumber", q.getQuotationNumber());
        map.put("status", q.getStatus());
        map.put("details", q.getDetails());
        map.put("reeCount", q.getReeCount());
        map.put("etCount", q.getEtCount());
        map.put("eqCount", q.getEqCount());
        map.put("obsCount", q.getObsCount());
        map.put("supCount", q.getSupCount());
        map.put("expCount", q.getExpCount());
        map.put("evaluationDurationDays", q.getEvaluationDurationDays());
        map.put("reeDurationDays", q.getReeDurationDays());
        map.put("etDurationDays", q.getEtDurationDays());
        map.put("eqDurationDays", q.getEqDurationDays());
        map.put("obsDurationDays", q.getObsDurationDays());
        map.put("supDurationDays", q.getSupDurationDays());
        map.put("expDurationDays", q.getExpDurationDays());
        map.put("dagComments", q.getDagComments());
        map.put("preparedByRaName", q.getPreparedByRaName());
        map.put("approvedByDagName", q.getApprovedByDagName());
        map.put("sentToDagDate", q.getSentToDagDate());
        map.put("approvedByDagDate", q.getApprovedByDagDate());
        map.put("createdAt", q.getCreatedAt());
        map.put("cdHelpRequested", q.getCdHelpRequested());
        map.put("cdHelpMessage", q.getCdHelpMessage());
        // amount is intentionally NOT included
        return map;
    }
}
