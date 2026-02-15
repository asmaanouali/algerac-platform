package com.algerac.repository;

import com.algerac.model.CASDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CASDecisionRepository extends JpaRepository<CASDecision, Long> {
    List<CASDecision> findByRequest_Id(Long requestId);
    Optional<CASDecision> findByDecisionNumber(String decisionNumber);
    Optional<CASDecision> findFirstByRequest_IdOrderByCreatedAtDesc(Long requestId);
}
