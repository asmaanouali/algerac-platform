package com.algerac.repository;

import com.algerac.model.QualificationCommission;
import com.algerac.model.CommissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QualificationCommissionRepository extends JpaRepository<QualificationCommission, Long> {
    List<QualificationCommission> findByStatusOrderByMeetingDateDesc(CommissionStatus status);
    List<QualificationCommission> findAllByOrderByMeetingDateDesc();
    Optional<QualificationCommission> findByReferenceNumber(String referenceNumber);
    List<QualificationCommission> findByMeetingDateAfter(LocalDate date);
    long countByStatus(CommissionStatus status);
}
