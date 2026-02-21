package com.algerac.repository;

import com.algerac.model.ComplementaryEvaluation;
import com.algerac.model.ComplementaryEvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplementaryEvaluationRepository extends JpaRepository<ComplementaryEvaluation, Long> {
    List<ComplementaryEvaluation> findByRequest_Id(Long requestId);
    Optional<ComplementaryEvaluation> findByEvaluationCode(String evaluationCode);
    List<ComplementaryEvaluation> findByStatus(ComplementaryEvaluationStatus status);
}
