package com.studit.repository;

import com.studit.domain.Reservation;
import com.studit.domain.ReservationStatus;
import com.studit.domain.Seat;
import com.studit.domain.User;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    @Query(
            """
            SELECT r FROM Reservation r
            JOIN FETCH r.seat s
            JOIN FETCH s.room
            WHERE r.user = :user
            ORDER BY r.date DESC, r.startTime ASC
            """)
    List<Reservation> findByUserOrderByDateDescStartTimeAsc(@Param("user") User user);

    @Query(
            """
            SELECT r FROM Reservation r
            JOIN FETCH r.user
            WHERE r.seat = :seat
              AND r.date = :date
              AND r.status = :status
            ORDER BY r.startTime
            """)
    List<Reservation> findBySeatAndDateAndStatusOrderByStartTimeAsc(
            @Param("seat") Seat seat,
            @Param("date") LocalDate date,
            @Param("status") ReservationStatus status);

    @Query(
            """
            SELECT r FROM Reservation r
            JOIN FETCH r.user
            JOIN FETCH r.seat
            WHERE r.seat.room.id = :roomId
              AND r.date = :date
              AND r.status = :status
            ORDER BY r.startTime
            """)
    List<Reservation> findByRoomAndDate(
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("status") ReservationStatus status);

    @Query(
            """
            SELECT r FROM Reservation r
            JOIN FETCH r.seat s
            JOIN FETCH s.room
            WHERE r.user = :user
              AND r.date >= :fromDate
              AND r.date <= :toDate
              AND r.status = :status
            """)
    List<Reservation> findUserReservationsBetween(
            @Param("user") User user,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("status") ReservationStatus status);

    @Query(
            """
            SELECT COUNT(DISTINCT r.seat.id) FROM Reservation r
            WHERE r.seat.id IN :seatIds
              AND r.date = :date
              AND r.status = :status
              AND r.startTime <= :now
              AND r.endTime > :now
            """)
    long countBusySeatsNow(
            @Param("seatIds") List<Long> seatIds,
            @Param("date") LocalDate date,
            @Param("now") LocalTime now,
            @Param("status") ReservationStatus status);

    @Query(
            """
            SELECT r FROM Reservation r
            WHERE r.date = :date
              AND r.status = :status
              AND r.startTime < :endTime
              AND r.endTime > :startTime
            """)
    List<Reservation> findOverlapping(
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("status") ReservationStatus status);

    @Query(
            """
            SELECT r FROM Reservation r
            WHERE r.seat = :seat
              AND r.date = :date
              AND r.status = :status
              AND r.startTime <= :now
              AND r.endTime > :now
            """)
    List<Reservation> findActiveOnSeat(
            @Param("seat") Seat seat,
            @Param("date") LocalDate date,
            @Param("now") LocalTime now,
            @Param("status") ReservationStatus status);
}
