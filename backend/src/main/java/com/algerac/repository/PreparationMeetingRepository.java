package com.algerac.repository;

import com.algerac.model.PreparationMeeting;
import com.algerac.model.PreparationMeetingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PreparationMeetingRepository extends JpaRepository<PreparationMeeting, Long> {
    List<PreparationMeeting> findByRequest_Id(Long requestId);
    List<PreparationMeeting> findByStatus(PreparationMeetingStatus status);
    List<PreparationMeeting> findByOrganizedBy_Id(Long userId);
}
