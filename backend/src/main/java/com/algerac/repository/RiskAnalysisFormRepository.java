package com.algerac.repository;

import com.algerac.model.RiskAnalysisForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskAnalysisFormRepository extends JpaRepository<RiskAnalysisForm, Long> {
    List<RiskAnalysisForm> findByRequest_Id(Long requestId);
    Optional<RiskAnalysisForm> findByFormCode(String formCode);
    List<RiskAnalysisForm> findBySurveillancePlan_Id(Long planId);
}
