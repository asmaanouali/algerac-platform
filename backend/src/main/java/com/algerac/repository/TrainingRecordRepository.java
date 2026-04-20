package com.algerac.repository;

import com.algerac.model.TrainingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingRecordRepository extends JpaRepository<TrainingRecord, Long> {
    List<TrainingRecord> findByEvaluator_IdOrderByStartDateDesc(Long evaluatorId);
    List<TrainingRecord> findByTrainingType(String trainingType);
    List<TrainingRecord> findByRecordStatus(String status);
}
