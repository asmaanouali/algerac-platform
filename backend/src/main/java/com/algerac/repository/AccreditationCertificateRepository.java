package com.algerac.repository;

import com.algerac.model.AccreditationCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccreditationCertificateRepository extends JpaRepository<AccreditationCertificate, Long> {
    Optional<AccreditationCertificate> findByRequest_Id(Long requestId);
    Optional<AccreditationCertificate> findByCertificateNumber(String certificateNumber);
}
