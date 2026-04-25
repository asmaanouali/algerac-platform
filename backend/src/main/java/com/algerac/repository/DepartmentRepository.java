package com.algerac.repository;

import com.algerac.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByCode(String code);
    List<Department> findAllByActiveTrueOrderByNameAsc();
    boolean existsByCode(String code);
}
