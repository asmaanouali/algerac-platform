package com.algerac.repository;

import com.algerac.model.ActionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {
    Optional<ActionPlan> findByGap_Id(Long gapId);
}
