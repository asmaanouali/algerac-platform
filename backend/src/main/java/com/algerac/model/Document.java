package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "request_id")
    private AccreditationRequest request; // Optional, some docs might be general
    
    @ManyToOne
    @JoinColumn(name = "uploader_id", nullable = false)
    private User uploader;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String type; // e.g., "manual", "procedure", "form"
    
    @Column(nullable = false)
    private String url; // File path or URL
    
    private String status; // "pending", "approved", "rejected"
    
    @Column(nullable = false)
    private LocalDateTime uploadDate;
    
    @PrePersist
    protected void onCreate() {
        if (uploadDate == null) {
            uploadDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "pending";
        }
    }
    
    // Helper methods
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
    
    public Long getUploaderId() {
        return uploader != null ? uploader.getId() : null;
    }
}
