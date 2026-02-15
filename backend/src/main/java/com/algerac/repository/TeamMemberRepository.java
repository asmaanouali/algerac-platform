package com.algerac.repository;

import com.algerac.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeam_Id(Long teamId);
    List<TeamMember> findByExpert_Id(Long expertId);
}
