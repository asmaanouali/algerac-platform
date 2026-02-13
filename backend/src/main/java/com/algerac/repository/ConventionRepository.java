package com.algerac.repository;

import com.algerac.model.Convention;
import com.algerac.model.ConventionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConventionRepository extends JpaRepository<Convention, Long> {
    Optional<Convention> findByConventionNumber(String conventionNumber);
    List<Convention> findByRequest_Id(Long requestId);
    List<Convention> findByStatus(ConventionStatus status);
    List<Convention> findByPreparedByRa_Id(Long raId);
}
