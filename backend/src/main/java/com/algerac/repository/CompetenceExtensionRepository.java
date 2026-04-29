package com.algerac.repository;

import com.algerac.model.CompetenceExtension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetenceExtensionRepository extends JpaRepository<CompetenceExtension, Long> {
    List<CompetenceExtension> findByEvaluator_IdOrderByCreatedAtDesc(Long evaluatorId);
    List<CompetenceExtension> findByStatusOrderByCreatedAtDesc(String status);
    List<CompetenceExtension> findAllByOrderByCreatedAtDesc();
}
