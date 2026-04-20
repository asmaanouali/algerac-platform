package com.algerac.repository;

import com.algerac.model.Qualification;
import com.algerac.model.QualificationStatus;
import com.algerac.model.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface QualificationRepository extends JpaRepository<Qualification, Long> {
    List<Qualification> findByEvaluator_Id(Long evaluatorId);
    List<Qualification> findByStatus(QualificationStatus status);
    List<Qualification> findByStatusIn(List<QualificationStatus> statuses);
    List<Qualification> findByQualifiedRole(TeamRole role);
    List<Qualification> findByExpiryDateBefore(LocalDate date);
    List<Qualification> findByExpiryDateBetween(LocalDate start, LocalDate end);
    Optional<Qualification> findByEvaluator_IdAndQualifiedRoleAndStatusIn(
        Long evaluatorId, TeamRole role, List<QualificationStatus> statuses);
    long countByStatus(QualificationStatus status);
    List<Qualification> findByCommission_Id(Long commissionId);
}
