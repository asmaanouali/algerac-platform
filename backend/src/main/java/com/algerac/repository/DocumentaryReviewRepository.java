package com.algerac.repository;

import com.algerac.model.DocumentaryReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentaryReviewRepository extends JpaRepository<DocumentaryReview, Long> {
    List<DocumentaryReview> findByRequest_Id(Long requestId);
    Optional<DocumentaryReview> findFirstByRequest_IdOrderByCreatedAtDesc(Long requestId);
}
