package com.algerac.repository;

import com.algerac.model.ReferentielEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReferentielEntryRepository extends JpaRepository<ReferentielEntry, Long> {

    List<ReferentielEntry> findByCategory(String category);

    boolean existsByCategoryAndCode(String category, String code);
}
