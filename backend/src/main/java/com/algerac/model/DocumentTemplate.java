package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String version;

    private String fileType;

    private LocalDateTime lastModified;

    private String filePath;

    @Builder.Default
    private Boolean isRealtime = false;

    @PrePersist
    protected void onCreate() {
        if (lastModified == null) {
            lastModified = LocalDateTime.now();
        }
        if (isRealtime == null) {
            isRealtime = false;
        }
    }
}
