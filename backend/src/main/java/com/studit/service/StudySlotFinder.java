package com.studit.service;

import com.studit.domain.ClassSchedule;
import com.studit.domain.DayOfWeekLabels;
import com.studit.domain.Reservation;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudySlotFinder {

    private static final LocalTime STUDY_DAY_START = LocalTime.of(9, 0);
    private static final LocalTime STUDY_DAY_END = LocalTime.of(23, 0);
    private static final int MIN_SLOT_MINUTES = 60;
    private static final int LOOKAHEAD_DAYS = 7;
    private static final int MAX_RECOMMENDATIONS = 5;

    public List<StudyWindow> findStudyWindows(
            List<ClassSchedule> schedules, List<Reservation> reservations, LocalDate today) {
        List<StudyWindow> candidates = new ArrayList<>();

        for (int offset = 0; offset < LOOKAHEAD_DAYS; offset++) {
            LocalDate targetDate = today.plusDays(offset);
            int dayOfWeek = targetDate.getDayOfWeek().getValue() - 1;
            List<BusyInterval> busy = busyIntervalsForDate(schedules, reservations, targetDate);

            for (int[] gap : findGaps(busy)) {
                int gapStart = gap[0];
                int gapEnd = gap[1];
                ScoredSlot scored = scoreSlot(gapStart, gapEnd, schedules, dayOfWeek, targetDate);
                int duration = gapEnd - gapStart;
                int slotEnd;
                if (duration >= 120) {
                    slotEnd = gapStart + 120;
                } else {
                    slotEnd = gapEnd;
                }

                candidates.add(
                        new StudyWindow(
                                targetDate,
                                DayOfWeekLabels.LABELS[dayOfWeek],
                                minutesToTime(gapStart),
                                minutesToTime(slotEnd),
                                scored.score(),
                                scored.tag(),
                                scored.afterSubject(),
                                slotTitle(scored.tag(), scored.afterSubject()),
                                slotEnd - gapStart));
            }
        }

        candidates.sort(
                Comparator.comparingInt(StudyWindow::score)
                        .reversed()
                        .thenComparing(StudyWindow::date)
                        .thenComparing(StudyWindow::startTime));
        return candidates.stream().limit(MAX_RECOMMENDATIONS * 2L).toList();
    }

    private List<BusyInterval> busyIntervalsForDate(
            List<ClassSchedule> schedules, List<Reservation> reservations, LocalDate targetDate) {
        int dayOfWeek = targetDate.getDayOfWeek().getValue() - 1;
        List<int[]> intervals = new ArrayList<>();
        List<String> classSubjects = new ArrayList<>();

        for (ClassSchedule schedule : schedules) {
            if (schedule.getDayOfWeek() != dayOfWeek) {
                continue;
            }
            intervals.add(
                    new int[] {
                        toMinutes(schedule.getStartTime()), toMinutes(schedule.getEndTime())
                    });
            classSubjects.add(schedule.getSubjectName());
        }

        for (Reservation reservation : reservations) {
            if (!reservation.getDate().equals(targetDate)) {
                continue;
            }
            intervals.add(
                    new int[] {
                        toMinutes(reservation.getStartTime()), toMinutes(reservation.getEndTime())
                    });
        }

        List<int[]> merged = mergeIntervals(intervals);
        List<BusyInterval> result = new ArrayList<>();
        for (int[] pair : merged) {
            String subject = null;
            result.add(new BusyInterval(pair[0], pair[1], subject));
        }
        return result;
    }

    private List<int[]> mergeIntervals(List<int[]> intervals) {
        if (intervals.isEmpty()) {
            return List.of();
        }
        intervals.sort(Comparator.comparingInt(a -> a[0]));
        List<int[]> merged = new ArrayList<>();
        merged.add(new int[] {intervals.get(0)[0], intervals.get(0)[1]});
        for (int i = 1; i < intervals.size(); i++) {
            int[] current = intervals.get(i);
            int[] last = merged.get(merged.size() - 1);
            if (current[0] <= last[1]) {
                last[1] = Math.max(last[1], current[1]);
            } else {
                merged.add(new int[] {current[0], current[1]});
            }
        }
        return merged;
    }

    private List<int[]> findGaps(List<BusyInterval> busyIntervals) {
        int dayStart = toMinutes(STUDY_DAY_START);
        int dayEnd = toMinutes(STUDY_DAY_END);
        int cursor = dayStart;
        List<int[]> gaps = new ArrayList<>();

        for (BusyInterval interval : busyIntervals) {
            if (interval.start() > cursor && interval.start() - cursor >= MIN_SLOT_MINUTES) {
                gaps.add(new int[] {cursor, interval.start()});
            }
            cursor = Math.max(cursor, interval.end());
        }
        if (dayEnd > cursor && dayEnd - cursor >= MIN_SLOT_MINUTES) {
            gaps.add(new int[] {cursor, dayEnd});
        }
        return gaps;
    }

    private ScoredSlot scoreSlot(
            int slotStart, int slotEnd, List<ClassSchedule> schedules, int dayOfWeek, LocalDate targetDate) {
        int duration = slotEnd - slotStart;
        int score = duration;
        ClassSchedule beforeClass = classBefore(schedules, dayOfWeek, slotStart);
        ClassSchedule nextClass = classAfter(schedules, dayOfWeek, slotEnd);

        String tag = "free_time";
        String afterSubject = null;

        if (beforeClass != null && slotStart - toMinutes(beforeClass.getEndTime()) <= 60) {
            score += 40;
            tag = "after_class";
            afterSubject = beforeClass.getSubjectName();
        } else if (beforeClass == null && slotStart < 11 * 60) {
            score += 25;
            tag = "morning_prep";
        } else if (nextClass == null && slotEnd >= 19 * 60) {
            score += 20;
            tag = "evening_review";
        } else if (duration >= 120) {
            score += 30;
            tag = "deep_study";
        }

        LocalDate today = LocalDate.now();
        if (targetDate.equals(today)) {
            score += 10;
        } else if (targetDate.equals(today.plusDays(1))) {
            score += 5;
        }
        if (duration >= 120) {
            score += 15;
        }

        return new ScoredSlot(score, tag, afterSubject);
    }

    private ClassSchedule classBefore(List<ClassSchedule> schedules, int dayOfWeek, int slotStartMinutes) {
        return schedules.stream()
                .filter(s -> s.getDayOfWeek() == dayOfWeek)
                .filter(s -> toMinutes(s.getEndTime()) <= slotStartMinutes)
                .max(Comparator.comparing(ClassSchedule::getEndTime))
                .orElse(null);
    }

    private ClassSchedule classAfter(List<ClassSchedule> schedules, int dayOfWeek, int slotEndMinutes) {
        return schedules.stream()
                .filter(s -> s.getDayOfWeek() == dayOfWeek)
                .filter(s -> toMinutes(s.getStartTime()) >= slotEndMinutes)
                .min(Comparator.comparing(ClassSchedule::getStartTime))
                .orElse(null);
    }

    private String slotTitle(String tag, String afterSubject) {
        return switch (tag) {
            case "after_class" ->
                    afterSubject != null ? afterSubject + " 수업 직후 복습" : "수업 직후 복습";
            case "morning_prep" -> "오전 예습 · 집중 학습";
            case "evening_review" -> "저녁 정리 · 마무리 학습";
            case "deep_study" -> "장시간 몰입 학습";
            default -> "공부하기 좋은 빈 시간";
        };
    }

    private static int toMinutes(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
    }

    private static LocalTime minutesToTime(int minutes) {
        minutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
        return LocalTime.of(minutes / 60, minutes % 60);
    }

    private record BusyInterval(int start, int end, String subject) {}

    private record ScoredSlot(int score, String tag, String afterSubject) {}

    public record StudyWindow(
            LocalDate date,
            String dayLabel,
            LocalTime startTime,
            LocalTime endTime,
            int score,
            String tag,
            String afterSubject,
            String title,
            int durationMinutes) {}
}
