package com.algerac.repository;

import com.algerac.model.Payment;
import com.algerac.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    List<Payment> findByRequest_Id(Long requestId);
    
    Optional<Payment> findByRequest_IdAndPaymentType(Long requestId, String paymentType);
    
    List<Payment> findByStatus(PaymentStatus status);
    
    Optional<Payment> findByTransactionId(String transactionId);
}
