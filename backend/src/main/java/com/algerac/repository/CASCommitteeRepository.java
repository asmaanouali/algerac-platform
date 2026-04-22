package com.algerac.repository;

import com.algerac.model.AccreditationDomain;
import com.algerac.model.CASCommittee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CASCommitteeRepository extends JpaRepository<CASCommittee, Long> {
    Optional<CASCommittee> findByDomain(AccreditationDomain domain);
    List<CASCommittee> findByActiveTrue();
    boolean existsByDomain(AccreditationDomain domain);
}
