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
    List<Gap> findByRequest_IdAndSentToOEC(Long requestId, Boolean sentToOEC);
    List<Gap> findByRequest_IdAndKeptByREE(Long requestId, Boolean keptByREE);
    List<Gap> findByCreatedBy_Id(Long userId);
    List<Gap> findByRequest_IdAndCreatedBy_Id(Long requestId, Long userId);
    Optional<Gap> findByGapCode(String gapCode);
    
    // Compte les écarts critiques non résolus
    long countByRequest_IdAndTypeAndStatusNot(Long requestId, GapType type, GapStatus status);
    
    // Compte les écarts par exigence
    long countByRequest_IdAndRequirement(Long requestId, String requirement);
    
    // OEC review counts
    long countByRequest_IdAndSentToOECAndOecAcceptedIsNull(Long requestId, Boolean sentToOEC);
    long countByRequest_IdAndSentToOECAndOecAccepted(Long requestId, Boolean sentToOEC, Boolean oecAccepted);
}
