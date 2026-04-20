package com.algerac.repository;

import com.algerac.model.EvaluationTeam;
import com.algerac.model.TeamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationTeamRepository extends JpaRepository<EvaluationTeam, Long> {
    List<EvaluationTeam> findByRequest_Id(Long requestId);
    Optional<EvaluationTeam> findByTeamCode(String teamCode);
    List<EvaluationTeam> findByStatus(TeamStatus status);
    List<EvaluationTeam> findByHasRecusationTrue();
    List<EvaluationTeam> findByStatusIn(List<TeamStatus> statuses);
}
