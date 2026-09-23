package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "database_backups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DatabaseBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String identifier;

    private String backupType;

    private String sizeLabel;

    // SUCCES / ATTENTION
    @Builder.Default
    private String status = "SUCCES";

    @Column(nullable = false)
    private LocalDateTime performedAt;

    @PrePersist
    protected void onCreate() {
        if (performedAt == null) {
            performedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "SUCCES";
        }
    }
}
