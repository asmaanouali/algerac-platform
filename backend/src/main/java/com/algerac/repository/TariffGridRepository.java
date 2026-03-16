package com.algerac.repository;

import com.algerac.model.TariffGrid;
import com.algerac.model.TariffCategory;
import com.algerac.model.TariffStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TariffGridRepository extends JpaRepository<TariffGrid, Long> {
    Optional<TariffGrid> findByTariffCode(String tariffCode);
    List<TariffGrid> findByStatus(TariffStatus status);
    List<TariffGrid> findByCategory(TariffCategory category);
    List<TariffGrid> findByForNationalOECTrue();
    List<TariffGrid> findByForForeignOECTrue();
    List<TariffGrid> findByApplicableDomainAndStatusAndForNationalOECTrue(String domain, TariffStatus status);
    List<TariffGrid> findByApplicableDomainAndStatusAndForForeignOECTrue(String domain, TariffStatus status);
    List<TariffGrid> findAllByOrderByCreatedAtDesc();
}
