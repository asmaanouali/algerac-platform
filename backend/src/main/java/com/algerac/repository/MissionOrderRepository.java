package com.algerac.repository;

import com.algerac.model.MissionOrder;
import com.algerac.model.MissionOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MissionOrderRepository extends JpaRepository<MissionOrder, Long> {
    List<MissionOrder> findByRequest_Id(Long requestId);
    List<MissionOrder> findByTeamMember_Id(Long memberId);
    List<MissionOrder> findByStatus(MissionOrderStatus status);
    Optional<MissionOrder> findByOrderNumber(String orderNumber);
}
