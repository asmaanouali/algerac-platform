package com.algerac.repository;

import com.algerac.model.FOR58Convocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FOR58ConvocationRepository extends JpaRepository<FOR58Convocation, Long> {
    List<FOR58Convocation> findByMeeting_Id(Long meetingId);
    Optional<FOR58Convocation> findByMeeting_IdAndMember_Id(Long meetingId, Long memberId);
    boolean existsByMeeting_IdAndMember_Id(Long meetingId, Long memberId);
}
