package com.studit.config;

import com.studit.domain.ClassSchedule;
import com.studit.domain.User;
import com.studit.repository.ClassScheduleRepository;
import com.studit.repository.UserRepository;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Django 시연용 jooho0813 계정 + 기본 5과목 시간표 */
@Component
@Order(2)
@RequiredArgsConstructor
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        User user =
                userRepository
                        .findByUsername("jooho0813")
                        .orElseGet(
                                () ->
                                        userRepository.save(
                                                User.builder()
                                                        .username("jooho0813")
                                                        .password(passwordEncoder.encode("demo"))
                                                        .build()));

        if (!classScheduleRepository.findByUserOrderByDayOfWeekAscStartTimeAsc(user).isEmpty()) {
            return;
        }

        seedSchedule(user, 0, "10:00", "13:30", "문학속의심리학", "북악관 604호");
        seedSchedule(user, 0, "15:00", "18:00", "글로벌미디어문화와영화영어", "북악관 706호");
        seedSchedule(user, 1, "12:00", "13:30", "웹클라이언트컴퓨팅", "미래관 447호");
        seedSchedule(user, 3, "12:00", "13:30", "웹클라이언트컴퓨팅", "미래관 447호");
        seedSchedule(user, 1, "13:30", "15:00", "소프트웨어프로젝트 I", "미래관 424호");
        seedSchedule(user, 3, "13:30", "15:00", "소프트웨어프로젝트 I", "미래관 424호");
        seedSchedule(user, 1, "15:00", "16:30", "웹서버컴퓨팅", "미래관 445호");
        seedSchedule(user, 3, "15:00", "16:30", "웹서버컴퓨팅", "미래관 445호");
        seedSchedule(user, 4, "12:00", "15:00", "다학제간캡스톤디자인", "미래관 424호");
    }

    private void seedSchedule(
            User user,
            int dayOfWeek,
            String start,
            String end,
            String subject,
            String location) {
        classScheduleRepository.save(
                ClassSchedule.builder()
                        .user(user)
                        .dayOfWeek(dayOfWeek)
                        .startTime(LocalTime.parse(start))
                        .endTime(LocalTime.parse(end))
                        .subjectName(subject)
                        .location(location)
                        .build());
    }
}
