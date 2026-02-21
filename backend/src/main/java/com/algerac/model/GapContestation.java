package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gap_contestations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GapContestation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gap_id", nullable = false)
    private Gap gap;

    @ManyToOne
    @JoinColumn(name = "request_id", nullable = false)
    private AccreditationRequest request;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String contestationReason; // Motifs de la contestation

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContestationStatus status;

    // CD désigne une personne non impliquée pour examiner
    @ManyToOne
    @JoinColumn(name = "examiner_id")
    private User designatedExaminer;

    private LocalDateTime examinerDesignatedDate;

    @Column(columnDefinition = "TEXT")
    private String examinerFindings; // Résultat de l'examen

    private Boolean contestationFounded; // Contestation fondée ?

    @Column(columnDefinition = "TEXT")
    private String examinerDecision; // Décision : modifié, supprimé, maintenu

    // Si contestation non fondée et OEC maintient sa position
    private Boolean oecMaintainsPosition;
    private Boolean escalatedToCAS; // Escalade au CAS

    @ManyToOne
    @JoinColumn(name = "contested_by_id")
    private User contestedBy; // Qui a contesté (représentant OEC)

    private LocalDateTime contestationDate;
    private LocalDateTime resolutionDate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = ContestationStatus.FILED;
    }
}
