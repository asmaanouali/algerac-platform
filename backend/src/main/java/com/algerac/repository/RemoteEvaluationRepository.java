package com.algerac.repository;

import com.algerac.model.RemoteEvaluation;
import com.algerac.model.RemoteEvalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RemoteEvaluationRepository extends JpaRepository<RemoteEvaluation, Long> {
    Optional<RemoteEvaluation> findByEvaluationCode(String evaluationCode);
    List<RemoteEvaluation> findByRequest_Id(Long requestId);
    List<RemoteEvaluation> findByStatus(RemoteEvalStatus status);
    List<RemoteEvaluation> findByStatusIn(List<RemoteEvalStatus> statuses);
    List<RemoteEvaluation> findAllByOrderByCreatedAtDesc();

    // Fiches d'écarts en retard (deadline dépassée, pas encore envoyées)
    @Query("SELECT r FROM RemoteEvaluation r WHERE r.status = :status " +
           "AND r.deviationSheetsDeadline < :now AND r.deviationSheetsSentDate IS NULL")
    List<RemoteEvaluation> findOverdueDeviationSheets(
            @Param("status") RemoteEvalStatus status, @Param("now") LocalDateTime now);

    // Documents OEC en retard
    @Query("SELECT r FROM RemoteEvaluation r WHERE r.status = :status " +
           "AND r.oecDocumentsDeadline < :now AND r.oecDocumentsReceivedDate IS NULL")
    List<RemoteEvaluation> findOverdueOecDocuments(
            @Param("status") RemoteEvalStatus status, @Param("now") LocalDateTime now);
}
