package com.algerac.repository;

import com.algerac.model.EvaluationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationPlanRepository extends JpaRepository<EvaluationPlan, Long> {
    List<EvaluationPlan> findByRequest_Id(Long requestId);
    Optional<EvaluationPlan> findByPlanCode(String planCode);
}
