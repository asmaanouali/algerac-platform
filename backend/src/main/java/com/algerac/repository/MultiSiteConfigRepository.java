package com.algerac.repository;

import com.algerac.model.MultiSiteConfig;
import com.algerac.model.MultiSiteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MultiSiteConfigRepository extends JpaRepository<MultiSiteConfig, Long> {
    Optional<MultiSiteConfig> findByConfigCode(String configCode);
    List<MultiSiteConfig> findByRequest_Id(Long requestId);
    List<MultiSiteConfig> findByStatus(MultiSiteStatus status);
    List<MultiSiteConfig> findAllByOrderByCreatedAtDesc();
}
