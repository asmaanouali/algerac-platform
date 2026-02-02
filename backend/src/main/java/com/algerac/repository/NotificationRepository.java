package com.algerac.repository;

import com.algerac.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUser_IdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByUser_IdAndReadFalseOrderByCreatedAtDesc(Long userId);
}
