package com.algerac.repository;

import com.algerac.model.AccreditationTransfer;
import com.algerac.model.TransferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccreditationTransferRepository extends JpaRepository<AccreditationTransfer, Long> {
    Optional<AccreditationTransfer> findByTransferCode(String transferCode);
    List<AccreditationTransfer> findByOriginalRequest_Id(Long requestId);
    List<AccreditationTransfer> findBySourceOec_Id(Long oecId);
    List<AccreditationTransfer> findByTargetOec_Id(Long oecId);
    List<AccreditationTransfer> findByStatus(TransferStatus status);
    List<AccreditationTransfer> findAllByOrderByCreatedAtDesc();
}
