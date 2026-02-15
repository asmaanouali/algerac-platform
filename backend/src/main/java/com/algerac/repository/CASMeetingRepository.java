package com.algerac.repository;

import com.algerac.model.CASMeeting;
import com.algerac.model.CASMeetingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CASMeetingRepository extends JpaRepository<CASMeeting, Long> {
    List<CASMeeting> findByRequest_Id(Long requestId);
    Optional<CASMeeting> findByMeetingCode(String meetingCode);
    List<CASMeeting> findByStatus(CASMeetingStatus status);
}
