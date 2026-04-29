package com.algerac.repository;

import com.algerac.model.EvaluatorMonitoringSheet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluatorMonitoringSheetRepository extends JpaRepository<EvaluatorMonitoringSheet, Long> {
    List<EvaluatorMonitoringSheet> findByEvaluator_IdOrderByCycleEndDateDesc(Long evaluatorId);
    List<EvaluatorMonitoringSheet> findByQualification_Id(Long qualificationId);
    List<EvaluatorMonitoringSheet> findByIsPermanent(Boolean isPermanent);
}
