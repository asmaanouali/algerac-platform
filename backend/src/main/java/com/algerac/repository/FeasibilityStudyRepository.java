package com.algerac.repository;

import com.algerac.model.FeasibilityStudy;
import com.algerac.model.FeasibilityDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeasibilityStudyRepository extends JpaRepository<FeasibilityStudy, Long> {
    Optional<FeasibilityStudy> findByRequest_Id(Long requestId);
    List<FeasibilityStudy> findByResponsableAccreditationId(Long raId);
    List<FeasibilityStudy> findByDecision(FeasibilityDecision decision);
}
