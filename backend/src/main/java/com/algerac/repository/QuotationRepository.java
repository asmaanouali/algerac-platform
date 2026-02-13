package com.algerac.repository;

import com.algerac.model.Quotation;
import com.algerac.model.QuotationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {
    Optional<Quotation> findByQuotationNumber(String quotationNumber);
    List<Quotation> findByRequest_Id(Long requestId);
    List<Quotation> findByStatus(QuotationStatus status);
    List<Quotation> findByPreparedByRa_Id(Long raId);
    List<Quotation> findByStatusIn(List<QuotationStatus> statuses);
}
