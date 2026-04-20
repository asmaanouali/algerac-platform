package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Commission de Qualification - FOR 105 (Convocation) / FOR 106 (Procès-verbal)
 */
@Entity
@Table(name = "qualification_commissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QualificationCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String referenceNumber;  // ex: CQ-2025-001

    private LocalDate meetingDate;
    private String meetingTime;
    private String meetingLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommissionStatus status;

    // Participants (JSON array: [{userId, name, role, present}])
    @Column(columnDefinition = "TEXT")
    private String participantsJson;

    // Ordre du jour / Agenda (JSON array of items)
    @Column(columnDefinition = "TEXT")
    private String agendaJson;

    // Procès-verbal (FOR 106)
    @Column(columnDefinition = "TEXT")
    private String minutesText;

    // Décisions prises (JSON array: [{qualificationId, evaluatorName, decisionType, details}])
    @Column(columnDefinition = "TEXT")
    private String decisionsJson;

    // Président de la commission (DG)
    @ManyToOne
    @JoinColumn(name = "president_id")
    private User president;

    // Rapporteur (DA)
    @ManyToOne
    @JoinColumn(name = "rapporteur_id")
    private User rapporteur;

    // Qualifications examinées lors de cette commission
    @OneToMany(mappedBy = "commission")
    @Builder.Default
    private List<Qualification> qualificationsExamined = new ArrayList<>();

    // Convocation envoyée (FOR 105)
    private Boolean convocationSent;
    private LocalDateTime convocationSentAt;

    // PV signé
    private Boolean pvSigned;
    private LocalDateTime pvSignedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = CommissionStatus.PLANNED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
