package com.studit.web;

import com.studit.domain.Reservation;
import com.studit.domain.ReservationStatus;
import com.studit.domain.Seat;
import com.studit.domain.StudyRoom;
import com.studit.repository.ReservationRepository;
import com.studit.repository.SeatRepository;
import com.studit.repository.StudyRoomRepository;
import com.studit.service.ReservationService;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomController {

    private final StudyRoomRepository studyRoomRepository;
    private final SeatRepository seatRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationService reservationService;

    @GetMapping
    public List<RoomListItem> listRooms() {
        return studyRoomRepository.findByActiveTrueOrderByBuildingAscFloorAscNameAsc().stream()
                .map(
                        room -> {
                            ReservationService.AvailabilityNow availability =
                                    reservationService.getRoomAvailabilityNow(room);
                            return new RoomListItem(
                                    room.getId(),
                                    room.getName(),
                                    room.getBuilding(),
                                    room.getFloor(),
                                    room.getCapacity(),
                                    room.getDescription(),
                                    room.getDisplayName(),
                                    availability.total(),
                                    availability.available());
                        })
                .toList();
    }

    @GetMapping("/{roomId}")
    public RoomDetailResponse getRoom(
            @PathVariable Long roomId, @RequestParam(required = false) String date) {
        StudyRoom room =
                studyRoomRepository
                        .findById(roomId)
                        .filter(StudyRoom::isActive)
                        .orElseThrow(() -> new IllegalArgumentException("스터디룸을 찾을 수 없습니다."));

        LocalDate selectedDate = parseDate(date, LocalDate.now());
        boolean isToday = selectedDate.equals(LocalDate.now());

        List<Seat> seats = seatRepository.findByRoomAndActiveTrueOrderBySeatNumberAsc(room);
        List<Reservation> dateReservations =
                reservationRepository.findByRoomAndDate(
                        room.getId(), selectedDate, ReservationStatus.CONFIRMED);

        Map<Long, List<Reservation>> bySeat = new HashMap<>();
        for (Reservation reservation : dateReservations) {
            bySeat.computeIfAbsent(reservation.getSeat().getId(), k -> new ArrayList<>()).add(reservation);
        }

        List<SeatItem> seatItems = new ArrayList<>();
        for (Seat seat : seats) {
            List<Reservation> seatReservations = bySeat.getOrDefault(seat.getId(), List.of());
            List<SlotItem> slots =
                    seatReservations.stream()
                            .map(
                                    r ->
                                            new SlotItem(
                                                    r.getId(),
                                                    r.getStartTime().toString().substring(0, 5),
                                                    r.getEndTime().toString().substring(0, 5),
                                                    r.getUser().getUsername(),
                                                    reservationService.getReservationSlotStatus(
                                                            r, selectedDate)))
                            .toList();

            Reservation active =
                    isToday ? reservationService.getActiveReservation(seat, selectedDate) : null;
            boolean hasReservations = !seatReservations.isEmpty();

            String statusLabel;
            String statusVariant;
            if (isToday) {
                statusLabel = active != null ? "사용 중" : "예약 가능";
                statusVariant = active != null ? "busy" : "available";
            } else if (hasReservations) {
                statusLabel = "예약 있음";
                statusVariant = "booked";
            } else {
                statusLabel = "비어 있음";
                statusVariant = "available";
            }

            seatItems.add(
                    new SeatItem(
                            seat.getId(),
                            seat.getSeatNumber(),
                            statusLabel,
                            statusVariant,
                            slots,
                            active != null));
        }

        ReservationService.AvailabilityDate availability =
                reservationService.getRoomAvailabilityForDate(room, selectedDate);

        return new RoomDetailResponse(
                room.getId(),
                room.getName(),
                room.getBuilding(),
                room.getFloor(),
                room.getCapacity(),
                room.getDescription(),
                room.getDisplayName(),
                selectedDate.toString(),
                isToday,
                availability.total(),
                availability.available(),
                availability.reserved(),
                seatItems);
    }

    private LocalDate parseDate(String dateStr, LocalDate defaultDate) {
        if (dateStr == null || dateStr.isBlank()) {
            return defaultDate;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException ex) {
            return defaultDate;
        }
    }

    public record RoomListItem(
            Long id,
            String name,
            String building,
            int floor,
            int capacity,
            String description,
            String displayName,
            int totalSeats,
            int availableSeats) {}

    public record SlotItem(
            Long reservationId,
            String startTime,
            String endTime,
            String username,
            String status) {}

    public record SeatItem(
            Long id,
            String seatNumber,
            String statusLabel,
            String statusVariant,
            List<SlotItem> slots,
            boolean inUse) {}

    public record RoomDetailResponse(
            Long id,
            String name,
            String building,
            int floor,
            int capacity,
            String description,
            String displayName,
            String selectedDate,
            boolean isToday,
            int totalSeats,
            int availableSeats,
            int reservedSeats,
            List<SeatItem> seats) {}
}
