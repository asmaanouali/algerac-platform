package com.algerac.repository;

import com.algerac.model.SystemLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    List<SystemLog> findAllByOrderByTimestampDesc();

    @Query("SELECT s FROM SystemLog s WHERE " +
           "(:level IS NULL OR s.level = :level) AND " +
           "(:module IS NULL OR s.module = :module) AND " +
           "(:search IS NULL OR LOWER(s.message) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "     OR LOWER(s.username) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY s.timestamp DESC")
    Page<SystemLog> findFiltered(@Param("level") String level,
                                  @Param("module") String module,
                                  @Param("search") String search,
                                  Pageable pageable);
}
