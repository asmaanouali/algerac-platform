package com.algerac.repository;

import com.algerac.model.RiskOpportunityRegister;
import com.algerac.model.RiskRegisterStatus;
import com.algerac.model.RiskType;
import com.algerac.model.RiskCategory;
import com.algerac.model.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RiskOpportunityRepository extends JpaRepository<RiskOpportunityRegister, Long> {
    Optional<RiskOpportunityRegister> findByRegisterCode(String registerCode);
    List<RiskOpportunityRegister> findByType(RiskType type);
    List<RiskOpportunityRegister> findByCategory(RiskCategory category);
    List<RiskOpportunityRegister> findByStatus(RiskRegisterStatus status);
    List<RiskOpportunityRegister> findByLevel(RiskLevel level);
    List<RiskOpportunityRegister> findByOwner_Id(Long ownerId);
    List<RiskOpportunityRegister> findByNextReviewDateBefore(LocalDate date);
    List<RiskOpportunityRegister> findAllByOrderByCreatedAtDesc();
    long countByType(RiskType type);
}
