package com.algerac.repository;

import com.algerac.model.FOR65CompetencyTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FOR65CompetencyTrackingRepository extends JpaRepository<FOR65CompetencyTracking, Long> {
    List<FOR65CompetencyTracking> findByMeeting_Id(Long meetingId);
    List<FOR65CompetencyTracking> findByMember_Id(Long memberId);
    List<FOR65CompetencyTracking> findByMember_IdOrderByCreatedAtDesc(Long memberId);
}
