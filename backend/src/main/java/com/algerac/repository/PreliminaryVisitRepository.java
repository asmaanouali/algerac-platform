package com.algerac.repository;

import com.algerac.model.PreliminaryVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PreliminaryVisitRepository extends JpaRepository<PreliminaryVisit, Long> {
    Optional<PreliminaryVisit> findByRequest_Id(Long requestId);
}
