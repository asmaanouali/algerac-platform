package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * PRO 26 : Site satellite d'un OEC multisites.
 * Rattaché à une AccreditationRequest. Le siège central est porté par AccreditationRequest
 * elle-même (champs mainSite*); cette entité ne représente que les sites secondaires.
 */
@Entity
@Table(name = "satellite_sites")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SatelliteSite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    @JsonIgnore
    private AccreditationRequest request;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String activities; // domaines/portée du site

    @Column(columnDefinition = "TEXT")
    private String personnel; // résumé du personnel sur site

    /** Site inclus dans la portée d'accréditation (PRO 26 §5.2-2) */
    private Boolean isInScope;

    /** ACTIVE / CLOSED — déclaration de fermeture par l'OEC (PRO 26 §5.5-4) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SatelliteSiteStatus status;

    private LocalDateTime closedAt;

    @Column(columnDefinition = "TEXT")
    private String closureReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
        if (status == null) status = SatelliteSiteStatus.ACTIVE;
        if (isInScope == null) isInScope = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @JsonProperty("requestId")
    public Long getRequestId() {
        return request != null ? request.getId() : null;
    }
}
