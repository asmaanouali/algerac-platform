package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * ALGERAC department. Each accreditation request is routed to a department,
 * and CDs/RAs belong to a department. Seeded with the 5 canonical departments
 * (Certification SM, Métrologie, Inspection, Essais, Biomédicale) but designed
 * to be extensible: new departments can be added by admins without a code change.
 */
@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Short stable code used in URLs and accreditation IDs (e.g. "CERT_SM", "METRO"). */
    @Column(nullable = false, unique = true, length = 32)
    private String code;

    /** Display name (e.g. "Certification SM"). */
    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (active == null) active = true;
    }
}
