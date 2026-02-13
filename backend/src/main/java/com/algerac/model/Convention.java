package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "conventions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Convention {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;
    
    @Column(nullable = false, unique = true)
    private String conventionNumber; // Numéro de convention (ex: CONV-2024-001)
    
    @ManyToOne
    @JoinColumn(name = "prepared_by_ra", nullable = false)
    private User preparedByRa;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConventionStatus status; // DRAFT, SENT_TO_OEC, VALIDATED_BY_OEC, REJECTED_BY_OEC
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String content; // Contenu de la convention
    
    @Lob
    @Column(columnDefinition = "TEXT")
    private String termsAndConditions; // Termes et conditions
    
    private LocalDateTime sentToOecDate;
    private LocalDateTime validatedByOecDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ConventionStatus.DRAFT;
        }
    }
    
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
    
    public Long getPreparedByRaId() {
        return preparedByRa != null ? preparedByRa.getId() : null;
    }
    
    public String getPreparedByRaName() {
        return preparedByRa != null ? preparedByRa.getFullName() : null;
    }
}
