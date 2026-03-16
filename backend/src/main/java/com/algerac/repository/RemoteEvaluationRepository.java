package com.algerac.repository;

import com.algerac.model.RemoteEvaluation;
import com.algerac.model.RemoteEvalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RemoteEvaluationRepository extends JpaRepository<RemoteEvaluation, Long> {
    Optional<RemoteEvaluation> findByEvaluationCode(String evaluationCode);
    List<RemoteEvaluation> findByRequest_Id(Long requestId);
    List<RemoteEvaluation> findByStatus(RemoteEvalStatus status);
    List<RemoteEvaluation> findByStatusIn(List<RemoteEvalStatus> statuses);
    List<RemoteEvaluation> findAllByOrderByCreatedAtDesc();
}
