package com.algerac.repository;

import com.algerac.model.EvaluationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EvaluationNoteRepository extends JpaRepository<EvaluationNote, Long> {
    List<EvaluationNote> findByRequest_Id(Long requestId);
    List<EvaluationNote> findByAuthor_Id(Long authorId);
    List<EvaluationNote> findByRequest_IdAndNoteType(Long requestId, String noteType);
    List<EvaluationNote> findByRequest_IdAndAuthor_Id(Long requestId, Long authorId);
    List<EvaluationNote> findByRequest_IdAndSentToREE(Long requestId, Boolean sentToREE);
    List<EvaluationNote> findByRequest_IdAndNoteTypeAndAuthor_Id(Long requestId, String noteType, Long authorId);
}
