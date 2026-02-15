package com.algerac.repository;

import com.algerac.model.CASVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CASVoteRepository extends JpaRepository<CASVote, Long> {
    List<CASVote> findByMeeting_Id(Long meetingId);
    List<CASVote> findByVoter_Id(Long voterId);
}
