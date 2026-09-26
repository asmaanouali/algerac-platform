package com.algerac.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DB-backed rate-limit bucket so login/OTP lockouts survive restarts and are
 * shared across multiple app instances (unlike the previous in-memory map).
 */
@Entity
@Table(name = "rate_limit_buckets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RateLimitBucket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String bucketKey;

    @Column(nullable = false)
    private int failureCount;

    private LocalDateTime lockedUntil;

    @Column(nullable = false)
    private LocalDateTime lastAttempt;
}
