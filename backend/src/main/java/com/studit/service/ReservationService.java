package com.studit.service;

import com.studit.domain.*;
import com.studit.exception.ReservationException;
import com.studit.repository.ClassScheduleRepository;
import com.studit.repository.ReservationRepository;
import com.studit.repository.SeatRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

    private final ReservationRepository reservationRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final SeatRepository seatRepository;

    @Transactional
    public Reservation createReservation(
            User user, Seat seat, LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException("종료 시간은 시작 시간보다 늦어야 합니다.");
        }

        validateNotInPast(date, startTime);
        validateNoSeatOverlap(seat, date, startTime, endTime);
        validateNoUserOverlap(user, date, startTime, endTime);
        validateNoScheduleConflict(user, date, startTime, endTime);

        Reservation reservation =
                Reservation.builder()
                        .user(user)
                        .seat(seat)
                        .date(date)
                        .startTime(startTime)
                        .endTime(endTime)
                        .status(ReservationStatus.CONFIRMED)
                        .build();
        return reservationRepository.save(reservation);
    }

    @Transactional
    public Reservation cancelReservation(Reservation reservation, User user) {
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new ReservationException("FORBIDDEN", "본인 예약만 취소할 수 있습니다.");
        }
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new ReservationException("ALREADY_CANCELLED", "이미 취소된 예약입니다.");
        }
        reservation.setStatus(ReservationStatus.CANCELLED);
        return reservationRepository.save(reservation);
    }

    public AvailabilityNow getRoomAvailabilityNow(StudyRoom room) {
        LocalDate today = LocalDate.now(ZONE);
        LocalTime now = LocalTime.now(ZONE);
        List<Seat> seats = seatRepository.findByRoomAndActiveTrueOrderBySeatNumberAsc(room);
        int total = seats.size();
        if (total == 0) {
            return new AvailabilityNow(0, 0);
        }
        List<Long> seatIds = seats.stream().map(Seat::getId).toList();
        long busy =
                reservationRepository.countBusySeatsNow(
                        seatIds, today, now, ReservationStatus.CONFIRMED);
        return new AvailabilityNow(total, (int) (total - busy));
    }

    public AvailabilityDate getRoomAvailabilityForDate(StudyRoom room, LocalDate date) {
        List<Seat> seats = seatRepository.findByRoomAndActiveTrueOrderBySeatNumberAsc(room);
        int total = seats.size();
        if (total == 0) {
            return new AvailabilityDate(0, 0, 0);
        }
        List<Long> seatIds = seats.stream().map(Seat::getId).toList();
        long reserved =
                reservationRepository.findByRoomAndDate(room.getId(), date, ReservationStatus.CONFIRMED)
                        .stream()
                        .map(r -> r.getSeat().getId())
                        .distinct()
                        .count();
        return new AvailabilityDate(total, (int) (total - reserved), (int) reserved);
    }

    public List<Reservation> getSeatReservationsForDate(Seat seat, LocalDate date) {
        return reservationRepository.findBySeatAndDateAndStatusOrderByStartTimeAsc(
                seat, date, ReservationStatus.CONFIRMED);
    }

    public String getReservationSlotStatus(Reservation reservation, LocalDate date) {
        LocalDate today = LocalDate.now(ZONE);
        if (!date.equals(today)) {
            return "booked";
        }
        LocalTime now = LocalTime.now(ZONE);
        if (!reservation.getStartTime().isAfter(now) && reservation.getEndTime().isAfter(now)) {
            return "active";
        }
        if (!reservation.getEndTime().isAfter(now)) {
            return "past";
        }
        return "upcoming";
    }

    public Reservation getActiveReservation(Seat seat, LocalDate date) {
        LocalDate today = LocalDate.now(ZONE);
        if (!date.equals(today)) {
            return null;
        }
        LocalTime now = LocalTime.now(ZONE);
        List<Reservation> active =
                reservationRepository.findActiveOnSeat(
                        seat, date, now, ReservationStatus.CONFIRMED);
        return active.isEmpty() ? null : active.get(0);
    }

    public List<Reservation> findOverlapping(LocalDate date, LocalTime startTime, LocalTime endTime) {
        return reservationRepository.findOverlapping(
                date, startTime, endTime, ReservationStatus.CONFIRMED);
    }

    private void validateNotInPast(LocalDate date, LocalTime startTime) {
        LocalDate today = LocalDate.now(ZONE);
        LocalTime now = LocalTime.now(ZONE);
        if (date.isBefore(today)) {
            throw new ReservationException("PAST_DATE", "과거 날짜는 예약할 수 없습니다.");
        }
        if (date.equals(today) && startTime.isBefore(now)) {
            throw new ReservationException("PAST_TIME", "이미 지난 시간은 예약할 수 없습니다.");
        }
    }

    private void validateNoSeatOverlap(
            Seat seat, LocalDate date, LocalTime startTime, LocalTime endTime) {
        boolean overlap =
                findOverlapping(date, startTime, endTime).stream()
                        .anyMatch(r -> r.getSeat().getId().equals(seat.getId()));
        if (overlap) {
            throw new ReservationException(
                    "SEAT_OVERLAP", "해당 좌석은 선택한 시간대에 이미 예약되어 있습니다.");
        }
    }

    private void validateNoUserOverlap(
            User user, LocalDate date, LocalTime startTime, LocalTime endTime) {
        findOverlapping(date, startTime, endTime).stream()
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .findFirst()
                .ifPresent(
                        existing -> {
                            throw new ReservationException(
                                    "USER_OVERLAP",
                                    "같은 시간대에 이미 "
                                            + existing.getSeat().getRoom().getName()
                                            + " · "
                                            + existing.getSeat().getSeatNumber()
                                            + "번 좌석을 예약했습니다. "
                                            + "한 시간대에는 하나의 좌석만 예약할 수 있습니다.");
                        });
    }

    private void validateNoScheduleConflict(
            User user, LocalDate date, LocalTime startTime, LocalTime endTime) {
        int dayOfWeek = date.getDayOfWeek().getValue() - 1;
        List<ClassSchedule> schedules =
                classScheduleRepository.findByUserAndDayOfWeek(user, dayOfWeek);
        for (ClassSchedule schedule : schedules) {
            if (timesOverlap(
                    startTime, endTime, schedule.getStartTime(), schedule.getEndTime())) {
                throw new ReservationException(
                        "SCHEDULE_CONFLICT",
                        "수업 시간("
                                + schedule.getSubjectName()
                                + ")과 겹칩니다. 다른 시간을 선택해 주세요.");
            }
        }
    }

    private static boolean timesOverlap(
            LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    public record AvailabilityNow(int total, int available) {}

    public record AvailabilityDate(int total, int available, int reserved) {}
}
