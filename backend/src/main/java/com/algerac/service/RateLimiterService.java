package com.algerac.service;

import com.algerac.model.SystemLog;
import com.algerac.repository.RateLimitBucketRepository;
import com.algerac.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * DB-backed sliding-window lockout tracker keyed by an arbitrary string
 * (e.g. "login:&lt;ip&gt;:&lt;email&gt;"). Persists across restarts and is shared across
 * app instances since all instances read/write the same rate_limit_buckets table.
 * Blocked attempts and newly-triggered lockouts are also written to the SystemLog
 * audit trail (visible under admin Security &gt; Audit Logs) for traceability.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private final RateLimitBucketRepository repository;
    private final SystemLogRepository systemLogRepository;

    public static class RateLimitedException extends RuntimeException {
        public RateLimitedException(String message) {
            super(message);
        }
    }

    /** Throws if the key is currently locked out; records the rejected attempt in the audit trail. */
    @Transactional
    public void assertNotLocked(String key, String module, String identifier, String ip) {
        repository.findByBucketKey(key).ifPresent(bucket -> {
            LocalDateTime lockedUntil = bucket.getLockedUntil();
            if (lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())) {
                long minutesLeft = Math.max(1, Duration.between(LocalDateTime.now(), lockedUntil).toMinutes());
                audit("WARNING", module, identifier, ip,
                        "Tentative rejetée : compte verrouillé (" + minutesLeft + " min restantes)");
                throw new RateLimitedException("Trop de tentatives. Veuillez réessayer dans " + minutesLeft + " minute(s).");
            }
        });
    }

    /** Records a failed/consumed attempt; logs to the audit trail the moment a lockout is triggered. */
    @Transactional
    public void recordFailure(String key, int maxAttempts, Duration lockoutDuration, String module, String identifier, String ip) {
        repository.recordFailureUpsert(key, maxAttempts, Math.max(1, lockoutDuration.toMinutes()));
        repository.findByBucketKey(key).ifPresent(bucket -> {
            LocalDateTime lockedUntil = bucket.getLockedUntil();
            boolean justLocked = lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now())
                    && bucket.getFailureCount() >= maxAttempts;
            if (justLocked) {
                audit("WARNING", module, identifier, ip,
                        "Verrouillage déclenché après " + bucket.getFailureCount() + " échec(s), jusqu'à " + lockedUntil);
            }
        });
    }

    /** Clears tracked failures for the key (call after a successful attempt). */
    @Transactional
    public void recordSuccess(String key) {
        repository.deleteByBucketKey(key);
    }

    /** Drops entries that have been idle well past any lockout window, to bound table size. */
    @Scheduled(fixedRate = 30 * 60 * 1000)
    @Transactional
    void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        repository.cleanup(cutoff, LocalDateTime.now());
    }

    private void audit(String level, String module, String identifier, String ip, String message) {
        try {
            systemLogRepository.save(SystemLog.builder()
                    .timestamp(LocalDateTime.now())
                    .level(level)
                    .module(module)
                    .message(message)
                    .username(identifier)
                    .sourceIp(ip)
                    .build());
        } catch (Exception e) {
            log.warn("RateLimiterService: unable to persist audit log entry - {}", e.getMessage());
        }
    }
}
