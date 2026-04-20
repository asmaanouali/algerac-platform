package com.algerac.repository;

import com.algerac.model.OECSatisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OECSatisfactionRepository extends JpaRepository<OECSatisfaction, Long> {
    List<OECSatisfaction> findByEvaluator_IdOrderByCreatedAtDesc(Long evaluatorId);
    List<OECSatisfaction> findByRequest_Id(Long requestId);
    List<OECSatisfaction> findByOecUser_Id(Long oecUserId);
}
