package com.studit.web;

import com.studit.domain.ClassSchedule;
import com.studit.domain.User;
import com.studit.repository.ClassScheduleRepository;
import com.studit.security.UserPrincipal;
import com.studit.service.RecommendationService;
import com.studit.service.ScheduleGridService;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetableController {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("H:mm");

    private final ClassScheduleRepository classScheduleRepository;
    private final ScheduleGridService scheduleGridService;
    private final RecommendationService recommendationService;

    @GetMapping
    public TimetableResponse list(@AuthenticationPrincipal UserPrincipal principal) {
        User user = principal.getUser();
        List<ClassSchedule> schedules = classScheduleRepository.findByUserOrderByDayOfWeekAscStartTimeAsc(user);
        return new TimetableResponse(
                schedules.stream().map(this::toItem).toList(),
                scheduleGridService.buildWeeklyGrid(schedules));
    }

    @PostMapping
    @Transactional
    public ScheduleItem create(
            @AuthenticationPrincipal UserPrincipal principal, @RequestBody CreateScheduleRequest request) {
        ClassSchedule schedule =
                ClassSchedule.builder()
                        .user(principal.getUser())
                        .dayOfWeek(request.dayOfWeek())
                        .startTime(LocalTime.parse(request.startTime(), TIME_FMT))
                        .endTime(LocalTime.parse(request.endTime(), TIME_FMT))
                        .subjectName(request.subjectName())
                        .location(request.location() != null ? request.location() : "")
                        .build();
        schedule = classScheduleRepository.save(schedule);
        return toItem(schedule);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        ClassSchedule schedule =
                classScheduleRepository
                        .findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("시간표를 찾을 수 없습니다."));
        if (!schedule.getUser().getId().equals(principal.getUser().getId())) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        classScheduleRepository.delete(schedule);
    }

    @GetMapping("/recommendations")
    public RecommendationService.RecommendationResult recommend(
            @AuthenticationPrincipal UserPrincipal principal) {
        return recommendationService.generateRecommendations(principal.getUser());
    }

    private ScheduleItem toItem(ClassSchedule schedule) {
        return new ScheduleItem(
                schedule.getId(),
                schedule.getDayOfWeek(),
                schedule.getDayLabel(),
                schedule.getStartTime().toString().substring(0, 5),
                schedule.getEndTime().toString().substring(0, 5),
                schedule.getSubjectName(),
                schedule.getLocation());
    }

    public record TimetableResponse(List<ScheduleItem> schedules, ScheduleGridService.WeeklyGrid grid) {}

    public record ScheduleItem(
            Long id,
            int dayOfWeek,
            String dayLabel,
            String startTime,
            String endTime,
            String subjectName,
            String location) {}

    public record CreateScheduleRequest(
            int dayOfWeek,
            String startTime,
            String endTime,
            String subjectName,
            String location) {}
}
