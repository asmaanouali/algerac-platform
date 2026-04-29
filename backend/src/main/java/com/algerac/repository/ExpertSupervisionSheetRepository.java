package com.algerac.repository;

import com.algerac.model.ExpertSupervisionSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpertSupervisionSheetRepository extends JpaRepository<ExpertSupervisionSheet, Long> {
    List<ExpertSupervisionSheet> findByExpert_IdOrderByInterventionDateDesc(Long expertId);
    List<ExpertSupervisionSheet> findBySupervisor_IdOrderByInterventionDateDesc(Long supervisorId);
    List<ExpertSupervisionSheet> findByRequestId(Long requestId);
}
