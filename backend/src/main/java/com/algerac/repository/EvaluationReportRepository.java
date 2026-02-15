package com.algerac.repository;

import com.algerac.model.EvaluationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationReportRepository extends JpaRepository<EvaluationReport, Long> {
    List<EvaluationReport> findByRequest_Id(Long requestId);
    Optional<EvaluationReport> findByReportNumber(String reportNumber);
    Optional<EvaluationReport> findFirstByRequest_IdOrderByCreatedAtDesc(Long requestId);
}
