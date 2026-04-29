package com.algerac.repository;

import com.algerac.model.RegularInfoBulletin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegularInfoBulletinRepository extends JpaRepository<RegularInfoBulletin, Long> {
    List<RegularInfoBulletin> findAllByOrderByPublishedDateDesc();
    List<RegularInfoBulletin> findByTypeOrderByPublishedDateDesc(String type);
}
