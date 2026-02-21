package com.algerac.repository;

import com.algerac.model.GapContestation;
import com.algerac.model.ContestationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GapContestationRepository extends JpaRepository<GapContestation, Long> {
    List<GapContestation> findByRequest_Id(Long requestId);
    List<GapContestation> findByGap_Id(Long gapId);
    List<GapContestation> findByStatus(ContestationStatus status);
    Optional<GapContestation> findByGap_IdAndStatusNot(Long gapId, ContestationStatus status);
    long countByRequest_IdAndStatus(Long requestId, ContestationStatus status);
}
