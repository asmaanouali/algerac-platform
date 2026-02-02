package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "accreditation_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String referenceNumber; // e.g., D-2024-001
    
    @ManyToOne
    @JoinColumn(name = "oec_id", nullable = false)
    private User oec;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;
    
    @Column(nullable = false)
    private String domain; // e.g., "Laboratoire Essais", "Inspection"
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;
    
    @Column(nullable = false)
    private Integer progress; // 0-100
    
    private LocalDateTime submissionDate;
    private LocalDateTime nextActionDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RequestStatus.DRAFT;
        }
        if (progress == null) {
            progress = 0;
        }
    }
    
    // Helper methods for JSON serialization
    public Long getOecId() {
        return oec != null ? oec.getId() : null;
    }
    
    public String getTypeLowercase() {
        return type != null ? type.name().toLowerCase() : null;
    }
    
    public String getStatusLowercase() {
        return status != null ? status.name().toLowerCase() : null;
    }
}
