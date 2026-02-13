package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.dto.PaymentDTO;
import com.algerac.model.Payment;
import com.algerac.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByRequest(@PathVariable Long requestId) {
        return ResponseEntity.ok(paymentService.getPaymentsByRequest(requestId));
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
     * Simuler un paiement (dans un vrai système, ceci serait géré par un provider de paiement)
     */
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
}
