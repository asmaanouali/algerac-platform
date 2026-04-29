package com.algerac.repository;

import com.algerac.model.SatelliteSite;
import com.algerac.model.SatelliteSiteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SatelliteSiteRepository extends JpaRepository<SatelliteSite, Long> {

    List<SatelliteSite> findByRequest_IdOrderByIdAsc(Long requestId);

    List<SatelliteSite> findByRequest_IdAndStatus(Long requestId, SatelliteSiteStatus status);

    long countByRequest_IdAndStatus(Long requestId, SatelliteSiteStatus status);
}
