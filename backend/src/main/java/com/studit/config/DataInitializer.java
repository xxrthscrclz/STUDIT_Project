package com.studit.config;

import com.studit.domain.Seat;
import com.studit.domain.StudyRoom;
import com.studit.repository.StudyRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final StudyRoomRepository studyRoomRepository;

    @Override
    public void run(String... args) {
        if (studyRoomRepository.count() > 0) {
            return;
        }

        StudyRoom room =
                StudyRoom.builder()
                        .name("미래관 1F 스터디룸")
                        .building("미래관")
                        .floor(1)
                        .capacity(8)
                        .description("캠퍼스 스터디룸 시연용 데이터")
                        .build();

        for (int i = 1; i <= 8; i++) {
            Seat seat = Seat.builder().room(room).seatNumber(String.valueOf(i)).build();
            room.getSeats().add(seat);
        }

        studyRoomRepository.save(room);
    }
}
