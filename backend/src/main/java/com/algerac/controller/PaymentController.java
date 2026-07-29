package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.PaymentDTO;
import com.algerac.model.Payment;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.UserRepository;
import com.algerac.service.PaymentService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    private final UserRepository userRepository;
    
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(paymentService.getPaymentsByRequest(requestId));
    }

    /**
     * OEC: paiements nécessitant une action de sa part (à payer ou preuve rejetée),
     * toutes demandes confondues — alimente les "actions requises" du tableau de bord.
     */
    @GetMapping("/my-pending")
    public ResponseEntity<List<PaymentDTO>> getMyPendingPayments(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(paymentService.getPendingPaymentsForOec(userId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPayment(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(paymentService.getPaymentById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * DAG: Récupérer tous les paiements
     */
    @GetMapping("/all")
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
    
    /**
     * DAG: Récupérer les paiements en attente de fixation des frais
     */
    @GetMapping("/awaiting-fees")
    public ResponseEntity<List<PaymentDTO>> getPaymentsAwaitingFees() {
        return ResponseEntity.ok(paymentService.getPaymentsAwaitingFees());
    }
    
    /**
     * DAG: Récupérer les paiements en attente de validation
     */
    @GetMapping("/awaiting-validation")
    public ResponseEntity<List<PaymentDTO>> getPaymentsAwaitingValidation() {
        return ResponseEntity.ok(paymentService.getPaymentsAwaitingValidation());
    }
    
    /**
     * DAG: Fixer les frais d'enregistrement
     */
    @PostMapping("/{id}/set-fee")
    public ResponseEntity<ApiResponse> setRegistrationFee(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.DAG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le DAG peut fixer les frais"));
            }
            
            Object amountObj = body.get("amount");
            BigDecimal amount;
            if (amountObj instanceof Number) {
                amount = new BigDecimal(amountObj.toString());
            } else {
                amount = new BigDecimal((String) amountObj);
            }
            
            Payment payment = paymentService.setRegistrationFee(id, amount, userId);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Frais d'enregistrement fixés à " + amount.toPlainString() + " DA",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * OEC: Soumettre la preuve de paiement
     */
    @PostMapping("/{id}/submit-proof")
    public ResponseEntity<ApiResponse> submitPaymentProof(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            String transactionId = body.get("transactionId");
            String proofBase64 = body.get("proofBase64");
            String proofName = body.get("proofName");
            String proofMimeType = body.get("proofMimeType");
            
            if (transactionId == null || transactionId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("L'identifiant de la transaction est requis"));
            }
            
            Payment payment = paymentService.submitPaymentProof(
                    id, transactionId.trim(), proofBase64, proofName, proofMimeType);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Preuve de paiement soumise avec succès. Le DAG va vérifier votre paiement.",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DAG: Valider le paiement
     */
    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse> validatePayment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.DAG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le DAG peut valider les paiements"));
            }
            
            String comments = body != null ? body.getOrDefault("comments", "") : "";
            
            Payment payment = paymentService.validatePaymentByDAG(id, userId, comments);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Paiement validé avec succès. Le dossier est transmis au CD pour assignation.",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DAG: Rejeter le paiement
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse> rejectPayment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }
            
            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            
            if (currentUser.getRole() != UserRole.DAG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le DAG peut rejeter les paiements"));
            }
            
            String comments = body.getOrDefault("comments", "Paiement non conforme");
            
            Payment payment = paymentService.rejectPaymentByDAG(id, userId, comments);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Paiement rejeté. L'OEC sera notifié.",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * DAG: Créer un paiement de tout type (redevance annuelle, surveillance, levée de suspension, etc.)
     * PRO_18 §5 - couvre tous les types de frais définis dans la procédure.
     */
    @PostMapping("/create-fee")
    public ResponseEntity<ApiResponse> createFee(
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        try {
            Long userId = (Long) session.getAttribute("userId");
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Non authentifié"));
            }

            User currentUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            if (currentUser.getRole() != UserRole.DAG) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Seul le DAG peut créer des paiements"));
            }

            Long requestId = Long.parseLong(body.get("requestId").toString());
            String paymentType = (String) body.get("paymentType");
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String currency = body.getOrDefault("currency", "DZD").toString();
            Integer dueDays = body.get("dueDays") != null ? ((Number) body.get("dueDays")).intValue() : null;
            String invoiceNumber = (String) body.get("invoiceNumber");

            Payment payment = paymentService.createArbitraryFeePayment(
                    requestId, paymentType, amount, currency, dueDays, invoiceNumber, userId);

            return ResponseEntity.ok(ApiResponse.success(
                    "Facture créée — L'OEC sera notifié.",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Legacy: Simuler un paiement (gardé pour compatibilité)
     */
    @SuppressWarnings("deprecation")
    @PostMapping("/{id}/process")
    public ResponseEntity<ApiResponse> processPayment(
            @PathVariable Long id,
            @RequestBody Map<String, String> paymentData) {
        try {
            String paymentMethod = paymentData.getOrDefault("paymentMethod", "CARD");
            String transactionId = paymentData.getOrDefault("transactionId", 
                    "TXN-" + System.currentTimeMillis());
            
            Payment payment = paymentService.processPayment(id, paymentMethod, transactionId);
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Paiement effectué avec succès",
                    payment
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * DAG / authorized: Télécharger la preuve de paiement
     */
    @GetMapping("/{id}/proof")
    public ResponseEntity<byte[]> downloadProof(
            @PathVariable Long id,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            Payment payment = paymentService.getPaymentById(id);
            String base64 = payment.getProofDocumentBase64();
            if (base64 == null || base64.isBlank()) {
                return ResponseEntity.notFound().build();
            }
            byte[] data = Base64.getDecoder().decode(base64);
            String mimeType = payment.getProofDocumentMimeType();
            if (mimeType == null || mimeType.isBlank()) mimeType = "application/octet-stream";
            String fileName = payment.getProofDocumentName();
            if (fileName == null || fileName.isBlank()) fileName = "preuve-paiement";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(mimeType));
            headers.setContentDisposition(
                ContentDisposition.attachment().filename(fileName).build());
            return ResponseEntity.ok().headers(headers).body(data);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
