package com.algerac.repository;

import com.algerac.model.Complaint;
import com.algerac.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    
    Optional<Complaint> findByTrackingCode(String trackingCode);
    
    List<Complaint> findBySubmittedByUserId(Long userId);
    
    List<Complaint> findByStatus(ComplaintStatus status);
    
    List<Complaint> findByIsPublicTrue();
    
    List<Complaint> findByIsPublicFalse();
    
    List<Complaint> findAllByOrderByCreatedAtDesc();
    
    long countByStatus(ComplaintStatus status);
}
