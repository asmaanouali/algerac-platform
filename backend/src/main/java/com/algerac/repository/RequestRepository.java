package com.algerac.repository;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<AccreditationRequest, Long> {
    
    // CHANGED: findByOecId → findByOec_Id
    List<AccreditationRequest> findByOec_Id(Long oecId);
    
    List<AccreditationRequest> findByStatus(RequestStatus status);
    
    List<AccreditationRequest> findByAssignedToRa_Id(Long raId);
    
    Optional<AccreditationRequest> findByReferenceNumber(String referenceNumber);
    
    boolean existsByReferenceNumber(String referenceNumber);
}