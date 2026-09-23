package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "referentiel_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferentielEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // OEC / EVALUATEUR / CAS
    @Column(nullable = false)
    private String category;

    private String code;

    @Column(nullable = false)
    private String name;

    private String type;

    private LocalDate accreditationDate;

    // ACTIF / SUSPENDU
    @Builder.Default
    private String status = "ACTIF";

    // Extra category-specific data, JSON encoded
    @Column(columnDefinition = "TEXT")
    private String extraJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = "ACTIF";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
