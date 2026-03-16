package com.algerac.repository;

import com.algerac.model.DomainDevelopmentRequest;
import com.algerac.model.DomainDevStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DomainDevelopmentRepository extends JpaRepository<DomainDevelopmentRequest, Long> {
    Optional<DomainDevelopmentRequest> findByRequestCode(String requestCode);
    List<DomainDevelopmentRequest> findByStatus(DomainDevStatus status);
    List<DomainDevelopmentRequest> findByRequestedBy_Id(Long userId);
    List<DomainDevelopmentRequest> findAllByOrderByCreatedAtDesc();
}
