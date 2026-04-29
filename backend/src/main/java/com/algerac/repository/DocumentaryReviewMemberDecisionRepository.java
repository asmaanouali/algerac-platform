package com.algerac.repository;

import com.algerac.model.DocumentaryReview;
import com.algerac.model.DocumentaryReviewMemberDecision;
import com.algerac.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentaryReviewMemberDecisionRepository
        extends JpaRepository<DocumentaryReviewMemberDecision, Long> {

    List<DocumentaryReviewMemberDecision> findByReview(DocumentaryReview review);

    Optional<DocumentaryReviewMemberDecision> findByReviewAndMember(DocumentaryReview review, User member);
}
