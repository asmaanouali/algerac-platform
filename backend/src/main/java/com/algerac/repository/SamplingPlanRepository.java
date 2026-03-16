package com.algerac.repository;

import com.algerac.model.SamplingPlan;
import com.algerac.model.SamplingPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SamplingPlanRepository extends JpaRepository<SamplingPlan, Long> {
    Optional<SamplingPlan> findByPlanCode(String planCode);
    List<SamplingPlan> findByRequest_Id(Long requestId);
    List<SamplingPlan> findByStatus(SamplingPlanStatus status);
    List<SamplingPlan> findByCreatedBy_Id(Long userId);
}
