package com.algerac.repository;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.RequestStatus;
import com.algerac.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RequestRepository extends JpaRepository<AccreditationRequest, Long> {
    
    // CHANGED: findByOecId → findByOec_Id
    List<AccreditationRequest> findByOec_Id(Long oecId);
    
    List<AccreditationRequest> findByStatus(RequestStatus status);
    
    List<AccreditationRequest> findByAssignedToRa_Id(Long raId);
    
    Optional<AccreditationRequest> findByReferenceNumber(String referenceNumber);
    
    boolean existsByReferenceNumber(String referenceNumber);
    
    List<AccreditationRequest> findByStatusIn(List<RequestStatus> statuses);
    
    long countByReferenceNumberStartingWith(String prefix);

    @Query("SELECT COUNT(r) FROM AccreditationRequest r WHERE r.referenceNumber LIKE :pattern")
    long countByReferenceNumberLike(@Param("pattern") String pattern);

    List<AccreditationRequest> findByAssignedToCd_Id(Long cdId);

    List<AccreditationRequest> findByDepartment_Id(Long departmentId);

    java.util.Optional<AccreditationRequest> findTopBySequenceNumberIsNotNullOrderBySequenceNumberDesc();

    /**
     * Retourne les OEC en statut PENDING (inscrits sans compte via /oecregister)
     * dont le DT a déjà validé la demande (statut différent de DRAFT, PENDING_DT_REVIEW, DT_REJECTED).
     */
    @Query("SELECT DISTINCT r.oec FROM AccreditationRequest r " +
           "WHERE r.oec.role = com.algerac.model.UserRole.OEC " +
           "AND r.oec.status = com.algerac.model.UserStatus.PENDING " +
           "AND r.oec.typeDemande IS NOT NULL " +
           "AND r.status NOT IN (:excluded)")
    List<User> findNewOECsPendingAccountCreation(
            @Param("excluded") List<RequestStatus> excluded);
}