package com.studit.repository;

import com.studit.domain.Seat;
import com.studit.domain.StudyRoom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SeatRepository extends JpaRepository<Seat, Long> {
    List<Seat> findByRoomAndActiveTrueOrderBySeatNumberAsc(StudyRoom room);

    @Query(
            """
            SELECT s FROM Seat s
            JOIN FETCH s.room r
            WHERE s.active = true AND r.active = true
            ORDER BY r.building, r.floor, s.seatNumber
            """)
    List<Seat> findAllActiveWithRoom();
}
