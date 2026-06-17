package com.studit.service;

import com.studit.domain.ClassSchedule;
import com.studit.domain.DayOfWeekLabels;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ScheduleGridService {

    private static final int DEFAULT_START = 9;
    private static final int DEFAULT_END = 18;

    public WeeklyGrid buildWeeklyGrid(List<ClassSchedule> schedules) {
        return buildWeeklyGrid(schedules, null, null, 0);
    }

    public WeeklyGrid buildWeeklyGrid(
            List<ClassSchedule> schedules, Integer forceStart, Integer forceEnd, int paddingHours) {
        int startHour = DEFAULT_START;
        int endHour = DEFAULT_END;

        for (ClassSchedule schedule : schedules) {
            startHour = Math.min(startHour, schedule.getStartTime().getHour());
            int neededEnd =
                    schedule.getEndTime().getMinute() > 0
                            ? schedule.getEndTime().getHour() + 1
                            : schedule.getEndTime().getHour();
            endHour = Math.max(endHour, neededEnd);
        }

        if (forceStart != null) {
            startHour = Math.min(startHour, forceStart);
        }
        if (forceEnd != null) {
            endHour = Math.max(endHour, forceEnd);
        }
        if (endHour <= startHour) {
            endHour = startHour + 1;
        }
        endHour += Math.max(paddingHours, 0);

        int totalMinutes = (endHour - startHour) * 60;
        List<HourLabel> hours = new ArrayList<>();
        for (int hour = startHour; hour < endHour; hour++) {
            hours.add(new HourLabel(hour, String.format("%02d:00", hour)));
        }

        List<GridBlock> blocks = new ArrayList<>();
        for (int index = 0; index < schedules.size(); index++) {
            ClassSchedule schedule = schedules.get(index);
            int startMinutes = toMinutes(schedule.getStartTime()) - startHour * 60;
            int endMinutes = toMinutes(schedule.getEndTime()) - startHour * 60;
            int duration = Math.max(endMinutes - startMinutes, 1);
            blocks.add(
                    new GridBlock(
                            schedule.getId(),
                            schedule.getDayOfWeek(),
                            schedule.getSubjectName(),
                            schedule.getStartTime().toString().substring(0, 5),
                            schedule.getEndTime().toString().substring(0, 5),
                            schedule.getLocation(),
                            schedule.getDayLabel(),
                            startMinutes / (double) totalMinutes * 100,
                            duration / (double) totalMinutes * 100,
                            index % 6));
        }

        List<GridDay> days = new ArrayList<>();
        for (int dayIndex = 0; dayIndex < DayOfWeekLabels.LABELS.length; dayIndex++) {
            int finalDayIndex = dayIndex;
            List<GridBlock> dayBlocks =
                    blocks.stream().filter(b -> b.dayOfWeek() == finalDayIndex).toList();
            days.add(new GridDay(dayIndex, DayOfWeekLabels.LABELS[dayIndex], dayBlocks));
        }

        return new WeeklyGrid(hours, days, startHour, endHour, endHour - startHour);
    }

    private static int toMinutes(LocalTime time) {
        return time.getHour() * 60 + time.getMinute();
    }

    public record HourLabel(int hour, String label) {}

    public record GridBlock(
            Long scheduleId,
            int dayOfWeek,
            String subjectName,
            String startTime,
            String endTime,
            String location,
            String dayLabel,
            double topPct,
            double heightPct,
            int colorIndex) {}

    public record GridDay(int index, String label, List<GridBlock> blocks) {}

    public record WeeklyGrid(
            List<HourLabel> hours, List<GridDay> days, int startHour, int endHour, int rowCount) {}
}
