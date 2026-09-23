package com.algerac.repository;

import com.algerac.model.OECApplication;
import com.algerac.model.OECApplication.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OECApplicationRepository extends JpaRepository<OECApplication, Long> {
    
    List<OECApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);
    
    List<OECApplication> findByStatusInOrderByCreatedAtDesc(List<ApplicationStatus> statuses);
    
    List<OECApplication> findAllByOrderByCreatedAtDesc();
    
    boolean existsByEmail(String email);

    Optional<OECApplication> findByEmail(String email);
}
