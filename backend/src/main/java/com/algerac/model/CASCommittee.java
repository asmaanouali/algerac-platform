package com.algerac.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * PRO 07 §5.1 — Each specialized accreditation committee is composed of 5 competent members
 * organized by activity domain. Includes elected president and vice-president.
 */
@Entity
@Table(name = "cas_committees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CASCommittee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccreditationDomain domain;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "president_id")
    private User president;

    @ManyToOne
    @JoinColumn(name = "vice_president_id")
    private User vicePresident;

    /**
     * All committee members (including president and vice-president counts toward the 5-member cap).
     * PRO 07 §5.1 — composed of five (05) competent members.
     */
    @ManyToMany
    @JoinTable(
        name = "cas_committee_members",
        joinColumns = @JoinColumn(name = "committee_id"),
        inverseJoinColumns = @JoinColumn(name = "member_id")
    )
    @Builder.Default
    private List<User> members = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Returns all unique members (president + vice-president + experts). */
    public List<User> getAllMembers() {
        Set<Long> seen = new HashSet<>();
        List<User> all = new ArrayList<>();
        if (president != null && seen.add(president.getId())) all.add(president);
        if (vicePresident != null && seen.add(vicePresident.getId())) all.add(vicePresident);
        if (members != null) {
            for (User m : members) {
                if (m != null && seen.add(m.getId())) all.add(m);
            }
        }
        return all;
    }

    @JsonProperty("memberCount")
    public int getMemberCount() {
        return getAllMembers().size();
    }

    @JsonProperty("domainLabel")
    public String getDomainLabel() {
        return domain != null ? domain.label : null;
    }

    @JsonProperty("presidentId")
    public Long getPresidentId() {
        return president != null ? president.getId() : null;
    }

    @JsonProperty("presidentName")
    public String getPresidentName() {
        return president != null ? president.getFullName() : null;
    }

    @JsonProperty("vicePresidentId")
    public Long getVicePresidentId() {
        return vicePresident != null ? vicePresident.getId() : null;
    }

    @JsonProperty("vicePresidentName")
    public String getVicePresidentName() {
        return vicePresident != null ? vicePresident.getFullName() : null;
    }
}
