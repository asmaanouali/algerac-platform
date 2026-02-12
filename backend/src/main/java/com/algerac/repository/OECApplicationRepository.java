package com.algerac.repository;

import com.algerac.model.OECApplication;
import com.algerac.model.OECApplication.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OECApplicationRepository extends JpaRepository<OECApplication, Long> {
    
    List<OECApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);
    
    List<OECApplication> findByStatusInOrderByCreatedAtDesc(List<ApplicationStatus> statuses);
    
    List<OECApplication> findAllByOrderByCreatedAtDesc();
    
    boolean existsByEmail(String email);
}
