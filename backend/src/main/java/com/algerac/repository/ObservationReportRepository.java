package com.algerac.repository;

import com.algerac.model.ObservationReport;
import com.algerac.model.ObservationVerdict;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationReportRepository extends JpaRepository<ObservationReport, Long> {
    List<ObservationReport> findByEvaluator_IdOrderByObservationDateDesc(Long evaluatorId);
    List<ObservationReport> findByObserver_Id(Long observerId);
    List<ObservationReport> findByQualification_Id(Long qualificationId);
    List<ObservationReport> findByVerdict(ObservationVerdict verdict);
    long countByEvaluator_Id(Long evaluatorId);
}
