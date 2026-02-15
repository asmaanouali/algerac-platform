package com.algerac.repository;

import com.algerac.model.SurveillancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SurveillancePlanRepository extends JpaRepository<SurveillancePlan, Long> {
    Optional<SurveillancePlan> findByCertificate_Id(Long certificateId);
    Optional<SurveillancePlan> findByPlanCode(String planCode);
}
