package com.algerac.repository;

import com.algerac.model.SupervisionPlan;
import com.algerac.model.SupervisionPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupervisionPlanRepository extends JpaRepository<SupervisionPlan, Long> {
    List<SupervisionPlan> findByEvaluator_Id(Long evaluatorId);
    List<SupervisionPlan> findBySupervisor_Id(Long supervisorId);
    List<SupervisionPlan> findByPlanYear(Integer year);
    List<SupervisionPlan> findByStatus(SupervisionPlanStatus status);
    List<SupervisionPlan> findByQualification_Id(Long qualificationId);
    long countByEvaluator_IdAndPlanYearGreaterThanEqual(Long evaluatorId, Integer year);
}
