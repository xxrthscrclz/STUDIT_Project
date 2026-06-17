package com.studit.web;

import com.studit.domain.Reservation;
import com.studit.domain.ReservationStatus;
import com.studit.domain.Seat;
import com.studit.domain.User;
import com.studit.exception.ReservationException;
import com.studit.repository.ReservationRepository;
import com.studit.repository.SeatRepository;
import com.studit.security.UserPrincipal;
import com.studit.service.ReservationService;
import com.studit.service.ScheduleGridService;
import com.studit.repository.ClassScheduleRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationController {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("H:mm");

    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;
    private final ReservationService reservationService;
    private final ClassScheduleRepository classScheduleRepository;
    private final ScheduleGridService scheduleGridService;

    @GetMapping("/me")
    public List<MyReservationItem> myReservations(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        return reservationRepository.findByUserOrderByDateDescStartTimeAsc(user).stream()
                .map(this::toMyItem)
                .toList();
    }

    @GetMapping("/seats/{seatId}/timeline")
    public SeatTimelineResponse seatTimeline(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long seatId,
            @RequestParam String date) {
        Seat seat =
                seatRepository
                        .findById(seatId)
                        .filter(Seat::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("좌석을 찾을 수 없습니다."));
        LocalDate reservationDate = LocalDate.parse(date);
        List<Reservation> reservations =
                reservationService.getSeatReservationsForDate(seat, reservationDate);

        TimelineResult timelineResult =
                buildHourlyTimeline(reservations, principal.getUser().getId());
        var schedules = classScheduleRepository.findByUserOrderByDayOfWeekAscStartTimeAsc(principal.getUser());
        var classGrid =
                schedules.isEmpty()
                        ? null
                        : scheduleGridService.buildWeeklyGrid(schedules);

        return new SeatTimelineResponse(
                seat.getId(),
                seat.getSeatNumber(),
                seat.getRoom().getId(),
                seat.getRoom().getDisplayName(),
                reservationDate.toString(),
                timelineResult.entries(),
                timelineResult.legend(),
                classGrid,
                !schedules.isEmpty());
    }

    @PostMapping
    @Transactional
    public MyReservationItem create(
            @AuthenticationPrincipal UserPrincipal principal, @RequestBody CreateReservationRequest request) {
        Seat seat =
                seatRepository
                        .findById(request.seatId())
                        .filter(Seat::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("좌석을 찾을 수 없습니다."));
        try {
            Reservation reservation =
                    reservationService.createReservation(
                            principal.getUser(),
                            seat,
                            LocalDate.parse(request.date()),
                            LocalTime.parse(request.startTime(), TIME_FMT),
                            LocalTime.parse(request.endTime(), TIME_FMT));
            return toMyItem(reservation);
        } catch (ReservationException ex) {
            throw ex;
        }
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public MyReservationItem cancel(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        Reservation reservation =
                reservationRepository
                        .findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다."));
        reservation = reservationService.cancelReservation(reservation, principal.getUser());
        return toMyItem(reservation);
    }

    private MyReservationItem toMyItem(Reservation reservation) {
        return new MyReservationItem(
                reservation.getId(),
                reservation.getSeat().getId(),
                reservation.getSeat().getSeatNumber(),
                reservation.getSeat().getRoom().getId(),
                reservation.getSeat().getRoom().getDisplayName(),
                reservation.getDate().toString(),
                reservation.getStartTime().toString().substring(0, 5),
                reservation.getEndTime().toString().substring(0, 5),
                reservation.getStatus().name().toLowerCase());
    }

    private TimelineResult buildHourlyTimeline(List<Reservation> reservations, Long currentUserId) {
        int startHour = 9;
        int endHour = 23;
        List<String> colors =
                List.of(
                        "#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#3b82f6", "#eab308",
                        "#22c55e", "#f43f5e", "#06b6d4");
        var userColors = new java.util.LinkedHashMap<Long, String>();
        var seenUsers = new java.util.LinkedHashMap<Long, String>();
        int colorIndex = 0;
        List<TimelineEntry> timeline = new ArrayList<>();

        for (int hour = startHour; hour < endHour; hour++) {
            LocalTime slotStart = LocalTime.of(hour, 0);
            LocalTime slotEnd = hour + 1 < 24 ? LocalTime.of(hour + 1, 0) : LocalTime.of(23, 59, 59);
            TimelineEntry entry =
                    new TimelineEntry(
                            hour,
                            String.format("%02d:00", hour),
                            hour + 1 < 24 ? String.format("%02d:00", hour + 1) : "24:00",
                            "free",
                            null,
                            null,
                            false);

            for (Reservation reservation : reservations) {
                if (timesOverlap(
                        reservation.getStartTime(),
                        reservation.getEndTime(),
                        slotStart,
                        slotEnd)) {
                    Long userId = reservation.getUser().getId();
                    if (!userColors.containsKey(userId)) {
                        userColors.put(userId, colors.get(colorIndex % colors.size()));
                        seenUsers.put(userId, reservation.getUser().getUsername());
                        colorIndex++;
                    }
                    entry =
                            new TimelineEntry(
                                    hour,
                                    entry.label(),
                                    entry.endLabel(),
                                    reservationService.getReservationSlotStatus(
                                            reservation, reservation.getDate()),
                                    reservation.getUser().getUsername(),
                                    userColors.get(userId),
                                    userId.equals(currentUserId));
                    break;
                }
            }
            timeline.add(entry);
        }

        List<LegendItem> legend =
                userColors.entrySet().stream()
                        .map(e -> new LegendItem(seenUsers.get(e.getKey()), e.getValue()))
                        .toList();
        return new TimelineResult(timeline, legend);
    }

    private static boolean timesOverlap(
            LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    public record CreateReservationRequest(Long seatId, String date, String startTime, String endTime) {}

    public record MyReservationItem(
            Long id,
            Long seatId,
            String seatNumber,
            Long roomId,
            String roomName,
            String date,
            String startTime,
            String endTime,
            String status) {}

    public record TimelineEntry(
            int hour,
            String label,
            String endLabel,
            String status,
            String userName,
            String color,
            boolean isMine) {}

    public record LegendItem(String userName, String color) {}

    public record SeatTimelineResponse(
            Long seatId,
            String seatNumber,
            Long roomId,
            String roomName,
            String date,
            List<TimelineEntry> timeline,
            List<LegendItem> legend,
            ScheduleGridService.WeeklyGrid classGrid,
            boolean hasClassSchedules) {}

    private record TimelineResult(List<TimelineEntry> entries, List<LegendItem> legend) {}
}
