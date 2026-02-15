package com.algerac.repository;

import com.algerac.model.Gap;
import com.algerac.model.GapType;
import com.algerac.model.GapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GapRepository extends JpaRepository<Gap, Long> {
    List<Gap> findByRequest_Id(Long requestId);
    List<Gap> findByRequest_IdAndType(Long requestId, GapType type);
    List<Gap> findByRequest_IdAndStatus(Long requestId, GapStatus status);
    Optional<Gap> findByGapCode(String gapCode);
    
    // Compte les écarts critiques non résolus
    long countByRequest_IdAndTypeAndStatusNot(Long requestId, GapType type, GapStatus status);
    
    // Compte les écarts par exigence
    long countByRequest_IdAndRequirement(Long requestId, String requirement);
}
