package com.algerac.repository;

import com.algerac.model.ReferenceRule;
import com.algerac.model.ReferenceRuleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferenceRuleRepository extends JpaRepository<ReferenceRule, Long> {
    Optional<ReferenceRule> findByRuleCode(String ruleCode);
    Optional<ReferenceRule> findByStandardCodeAndStandardVersion(String code, String version);
    List<ReferenceRule> findByStatus(ReferenceRuleStatus status);
    List<ReferenceRule> findByStatusIn(List<ReferenceRuleStatus> statuses);
    List<ReferenceRule> findAllByOrderByCreatedAtDesc();
}
