package com.algerac.repository;

import com.algerac.model.SurveillanceEvaluation;
import com.algerac.model.SurveillanceEvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SurveillanceEvaluationRepository extends JpaRepository<SurveillanceEvaluation, Long> {
    List<SurveillanceEvaluation> findByRequest_Id(Long requestId);
    List<SurveillanceEvaluation> findByCertificate_Id(Long certificateId);
    Optional<SurveillanceEvaluation> findByEvaluationCode(String evaluationCode);
    List<SurveillanceEvaluation> findByStatus(SurveillanceEvaluationStatus status);
    List<SurveillanceEvaluation> findByStatusIn(Collection<SurveillanceEvaluationStatus> statuses);
    List<SurveillanceEvaluation> findByStatusAndEvaluationDateBefore(SurveillanceEvaluationStatus status, LocalDateTime date);
    List<SurveillanceEvaluation> findBySurveillancePlan_Id(Long planId);
}
