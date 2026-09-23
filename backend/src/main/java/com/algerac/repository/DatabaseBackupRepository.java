package com.algerac.repository;

import com.algerac.model.DatabaseBackup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DatabaseBackupRepository extends JpaRepository<DatabaseBackup, Long> {

    List<DatabaseBackup> findAllByOrderByPerformedAtDesc();
}
