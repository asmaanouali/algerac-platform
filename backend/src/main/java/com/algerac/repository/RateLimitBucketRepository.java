package com.algerac.repository;

import com.algerac.model.RateLimitBucket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RateLimitBucketRepository extends JpaRepository<RateLimitBucket, Long> {

    Optional<RateLimitBucket> findByBucketKey(String bucketKey);

    void deleteByBucketKey(String bucketKey);

    /**
     * Atomic upsert (Postgres INSERT ... ON CONFLICT) so concurrent requests from
     * multiple app instances can't race on read-then-write of the same bucket.
     * Resets the counter to 1 if the previous lockout has already expired.
     */
    @Modifying
    @Query(value = """
            INSERT INTO rate_limit_buckets (bucket_key, failure_count, locked_until, last_attempt)
            VALUES (:key, 1, NULL, now())
            ON CONFLICT (bucket_key) DO UPDATE SET
              failure_count = CASE
                WHEN rate_limit_buckets.locked_until IS NOT NULL AND rate_limit_buckets.locked_until < now()
                  THEN 1
                ELSE rate_limit_buckets.failure_count + 1
              END,
              locked_until = CASE
                WHEN (CASE
                        WHEN rate_limit_buckets.locked_until IS NOT NULL AND rate_limit_buckets.locked_until < now() THEN 1
                        ELSE rate_limit_buckets.failure_count + 1
                      END) >= :maxAttempts
                  THEN now() + make_interval(mins => :lockoutMinutes::int)
                WHEN rate_limit_buckets.locked_until IS NOT NULL AND rate_limit_buckets.locked_until < now()
                  THEN NULL
                ELSE rate_limit_buckets.locked_until
              END,
              last_attempt = now()
            """, nativeQuery = true)
    void recordFailureUpsert(@Param("key") String key, @Param("maxAttempts") int maxAttempts,
            @Param("lockoutMinutes") long lockoutMinutes);

    @Modifying
    @Query("delete from RateLimitBucket b where b.lastAttempt < :cutoff "
            + "and (b.lockedUntil is null or b.lockedUntil < :now)")
    void cleanup(@Param("cutoff") LocalDateTime cutoff, @Param("now") LocalDateTime now);
}
