package com.algerac.repository;

import com.algerac.model.MaintenanceTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceTaskRepository extends JpaRepository<MaintenanceTask, Long> {

    List<MaintenanceTask> findByStatus(String status);

    List<MaintenanceTask> findByStatusOrderByScheduledStartAsc(String status);

    List<MaintenanceTask> findByScheduledStartAfterOrderByScheduledStartAsc(LocalDateTime from);

    List<MaintenanceTask> findAllByOrderByScheduledStartDesc();
}
