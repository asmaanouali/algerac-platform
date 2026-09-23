package com.algerac.repository;

import com.algerac.model.AdminRoleDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRoleDefinitionRepository extends JpaRepository<AdminRoleDefinition, Long> {

    Optional<AdminRoleDefinition> findByCode(String code);

    boolean existsByCode(String code);
}
