package com.algerac.service;

import com.algerac.dto.PaymentDTO;
import com.algerac.model.*;
import com.algerac.repository.PaymentRepository;
import com.algerac.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final RequestRepository requestRepository;
    private final NotificationService notificationService;
    
    private static final BigDecimal REGISTRATION_FEE = new BigDecimal("5000.00"); // En DA
    
    @Transactional
    public Payment createRegistrationFeePayment(Long requestId) {
        AccreditationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Demande non trouvée"));
        
        // Vérifier si un paiement existe déjà
        if (paymentRepository.findByRequest_IdAndPaymentType(requestId, "REGISTRATION_FEE").isPresent()) {
            throw new RuntimeException("Un paiement existe déjà pour cette demande");
        }
        
        Payment payment = Payment.builder()
                .request(request)
                .amount(REGISTRATION_FEE)
                .paymentType("REGISTRATION_FEE")
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        
        payment = paymentRepository.save(payment);
        log.info("Paiement créé pour la demande {} - Montant: {} DA", request.getReferenceNumber(), REGISTRATION_FEE);
        
        return payment;
    }
    
    @Transactional
    public Payment processPayment(Long paymentId, String paymentMethod, String transactionId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
        
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new RuntimeException("Ce paiement a déjà été traité");
        }
        
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaymentMethod(paymentMethod);
        payment.setTransactionId(transactionId);
        payment.setPaymentDate(LocalDateTime.now());
        
        payment = paymentRepository.save(payment);
        
        // Mettre à jour le statut de la demande
        AccreditationRequest request = payment.getRequest();
        request.setStatus(RequestStatus.PAYMENT_COMPLETED);
        requestRepository.save(request);
        
        log.info("Paiement effectué pour la demande {} - Transaction: {}", 
                request.getReferenceNumber(), transactionId);
        
        // Notifier le CD qu'une nouvelle demande est prête pour attribution
        notificationService.notifyChefDepartmentNewRequest(request);
        
        return payment;
    }
    
    public List<PaymentDTO> getPaymentsByRequest(Long requestId) {
        return paymentRepository.findByRequest_Id(requestId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Paiement non trouvé"));
    }
    
    private PaymentDTO convertToDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .requestId(payment.getRequestId())
                .requestReferenceNumber(payment.getRequest().getReferenceNumber())
                .amount(payment.getAmount())
                .paymentType(payment.getPaymentType())
                .status(payment.getStatus().name())
                .transactionId(payment.getTransactionId())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
