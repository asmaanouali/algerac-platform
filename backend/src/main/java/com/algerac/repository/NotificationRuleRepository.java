package com.algerac.repository;

import com.algerac.model.NotificationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRuleRepository extends JpaRepository<NotificationRule, Long> {
}
