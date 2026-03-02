package com.algerac.repository;

import com.algerac.model.Mandate;
import com.algerac.model.MandateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MandateRepository extends JpaRepository<Mandate, Long> {
    List<Mandate> findByRequest_Id(Long requestId);
    List<Mandate> findByTeamMember_Id(Long teamMemberId);
    List<Mandate> findByTeamMember_Expert_Id(Long expertId);
    List<Mandate> findByStatus(MandateStatus status);
    List<Mandate> findByRequest_IdAndStatus(Long requestId, MandateStatus status);
}
