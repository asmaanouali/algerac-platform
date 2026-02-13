package com.algerac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDTO {
    private Long id;
    private Long requestId;
    private String requestReferenceNumber;
    private BigDecimal amount;
    private String paymentType;
    private String status;
    private String transactionId;
    private String paymentMethod;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
}
