package com.studit.repository;

import com.studit.domain.StudyRoom;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyRoomRepository extends JpaRepository<StudyRoom, Long> {
    List<StudyRoom> findByActiveTrueOrderByBuildingAscFloorAscNameAsc();
}
