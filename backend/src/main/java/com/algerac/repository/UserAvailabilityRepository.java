package com.algerac.repository;

import com.algerac.model.UserAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface UserAvailabilityRepository extends JpaRepository<UserAvailability, Long> {
    List<UserAvailability> findByUser_Id(Long userId);
    List<UserAvailability> findByUser_IdAndUnavailableDateBetween(Long userId, LocalDate start, LocalDate end);
    List<UserAvailability> findByUnavailableDate(LocalDate date);
    void deleteByUser_IdAndUnavailableDate(Long userId, LocalDate date);
}
