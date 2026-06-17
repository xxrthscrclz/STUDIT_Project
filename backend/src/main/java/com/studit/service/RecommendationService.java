package com.studit.service;

import com.studit.config.GeminiProperties;
import com.studit.domain.*;
import com.studit.repository.ClassScheduleRepository;
import com.studit.repository.ReservationRepository;
import com.studit.repository.SeatRepository;
import com.studit.service.GeminiClient.GeminiException;
import com.studit.service.StudySlotFinder.StudyWindow;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Map<String, String> STUDY_METHODS =
            Map.of(
                    "after_class",
                    "수업 직후 10분 안에 핵심 개념 3가지를 적고, 25분 포모도로로 예제 문제를 풀어 보세요.",
                    "morning_prep",
                    "오늘 배울 내용을 미리 훑은 뒤, 질문 2~3개를 메모해 수업에서 확인하세요.",
                    "evening_review",
                    "오늘 배운 내용을 한 장 요약 노트로 정리하고, 모르는 부분만 표시해 다음 날 복습하세요.",
                    "deep_study",
                    "90분 집중 + 15분 휴식으로 나누고, 중간중간 스스로에게 설명하듯 말로 복습하세요.",
                    "free_time",
                    "목표를 하나 정한 뒤 타이머를 켜고, 끝나면 5분간 배운 내용을 소리 내어 정리하세요.");

    private static final Map<String, String> FALLBACK_COMMENTS =
            Map.of(
                    "after_class", "{subject} 수업 내용이 아직 생생할 때 복습하면 기억 정착에 가장 효과적입니다.",
                    "morning_prep", "수업 전 오전 시간은 집중력이 높아 예습과 개념 정리에 적합합니다.",
                    "evening_review", "하루 수업을 마친 뒤 저녁 시간에 정리하면 장기 기억으로 전환하기 좋습니다.",
                    "deep_study", "수업 사이 긴 공백은 과제와 심화 학습을 위한 몰입 시간으로 활용하기 좋습니다.",
                    "free_time", "수업과 예약 사이의 빈 시간을 활용하면 학습 루틴을 꾸준히 유지할 수 있습니다.");

    private final ClassScheduleRepository classScheduleRepository;
    private final ReservationRepository reservationRepository;
    private final SeatRepository seatRepository;
    private final ReservationService reservationService;
    private final StudySlotFinder studySlotFinder;
    private final ScheduleGridService scheduleGridService;
    private final GeminiClient geminiClient;
    private final GeminiProperties geminiProperties;

    public RecommendationResult generateRecommendations(User user) {
        List<ClassSchedule> schedules = classScheduleRepository.findByUserOrderByDayOfWeekAscStartTimeAsc(user);
        LocalDate today = LocalDate.now();
        List<Reservation> reservations =
                reservationRepository.findUserReservationsBetween(
                        user, today, today.plusDays(7), ReservationStatus.CONFIRMED);

        List<StudyWindow> rawWindows = studySlotFinder.findStudyWindows(schedules, reservations, today);
        List<RecommendationSlot> slots = new ArrayList<>();

        for (StudyWindow window : rawWindows) {
            Seat seat = findAvailableSeat(window.date(), window.startTime(), window.endTime());
            if (seat == null) {
                continue;
            }
            slots.add(buildSlot(window, seat));
            if (slots.size() >= 5) {
                break;
            }
        }

        String scheduleSummary = formatScheduleSummary(schedules);
        ScheduleGridService.WeeklyGrid grid =
                scheduleGridService.buildWeeklyGrid(schedules, 8, 23, 1);

        if (slots.isEmpty()) {
            return baseResult(schedules, scheduleSummary, grid)
                    .summary(fallbackSummary(schedules, slots))
                    .studyTips(fallbackStudyTips(schedules))
                    .slots(List.of())
                    .llmUsed(false)
                    .llmStatus("추천 가능한 시간대가 없습니다.")
                    .build();
        }

        List<Map<String, Object>> llmPayload = new ArrayList<>();
        for (int index = 0; index < slots.size(); index++) {
            RecommendationSlot slot = slots.get(index);
            llmPayload.add(
                    Map.of(
                            "index", index,
                            "day", slot.dayLabel(),
                            "date", slot.date(),
                            "time", slot.startTime() + "~" + slot.endTime(),
                            "title", slot.title(),
                            "tag", slot.tag(),
                            "after_subject", slot.afterSubject() != null ? slot.afterSubject() : ""));
        }

        String llmStatus =
                "GEMINI_API_KEY를 설정하면 Gemini AI 코멘트를 받을 수 있습니다.";

        if (geminiClient.isConfigured()) {
            try {
                Map<String, Object> llmData = geminiClient.generateStudyCommentary(scheduleSummary, llmPayload);
                applyLlmCommentary(slots, llmData);
                return baseResult(schedules, scheduleSummary, grid)
                        .summary(stringValue(llmData.get("summary"), fallbackSummary(schedules, slots)))
                        .studyTips(stringValue(llmData.get("study_tips"), fallbackStudyTips(schedules)))
                        .slots(slots)
                        .llmUsed(true)
                        .llmStatus("Google Gemini (" + geminiProperties.getModel() + ") 연결 성공!")
                        .build();
            } catch (GeminiException ex) {
                llmStatus = geminiClient.errorMessage(ex);
            }
        }

        for (RecommendationSlot slot : slots) {
            if (slot.comment() == null) {
                // already set in buildSlot
            }
        }

        return baseResult(schedules, scheduleSummary, grid)
                .summary(fallbackSummary(schedules, slots))
                .studyTips(fallbackStudyTips(schedules))
                .slots(slots)
                .llmUsed(false)
                .llmStatus(llmStatus)
                .build();
    }

    private RecommendationSlot buildSlot(StudyWindow window, Seat seat) {
        return new RecommendationSlot(
                window.date().toString(),
                window.dayLabel(),
                window.startTime().toString().substring(0, 5),
                window.endTime().toString().substring(0, 5),
                window.title(),
                window.tag(),
                window.afterSubject(),
                fallbackComment(window),
                STUDY_METHODS.getOrDefault(window.tag(), STUDY_METHODS.get("free_time")),
                seat.getId(),
                seat.getRoom().getDisplayName(),
                seat.getSeatNumber());
    }

    @SuppressWarnings("unchecked")
    private void applyLlmCommentary(List<RecommendationSlot> slots, Map<String, Object> llmData) {
        List<Map<String, Object>> llmSlots =
                llmData.get("slots") instanceof List<?> list
                        ? (List<Map<String, Object>>) list
                        : List.of();
        Map<Integer, Map<String, Object>> byIndex = new HashMap<>();
        for (Map<String, Object> item : llmSlots) {
            Object index = item.get("index");
            if (index instanceof Number number) {
                byIndex.put(number.intValue(), item);
            }
        }

        for (int i = 0; i < slots.size(); i++) {
            RecommendationSlot slot = slots.get(i);
            Map<String, Object> llmSlot = byIndex.getOrDefault(i, Map.of());
            String comment = stringValue(llmSlot.get("comment"), slot.comment());
            String studyMethod =
                    stringValue(
                            llmSlot.get("study_method"),
                            STUDY_METHODS.getOrDefault(slot.tag(), STUDY_METHODS.get("free_time")));
            slots.set(
                    i,
                    new RecommendationSlot(
                            slot.date(),
                            slot.dayLabel(),
                            slot.startTime(),
                            slot.endTime(),
                            slot.title(),
                            slot.tag(),
                            slot.afterSubject(),
                            comment,
                            studyMethod,
                            slot.seatId(),
                            slot.roomName(),
                            slot.seatNumber()));
        }
    }

    private Seat findAvailableSeat(LocalDate date, java.time.LocalTime startTime, java.time.LocalTime endTime) {
        Set<Long> reserved =
                new HashSet<>(
                        reservationService.findOverlapping(date, startTime, endTime).stream()
                                .map(r -> r.getSeat().getId())
                                .toList());
        return seatRepository.findAllActiveWithRoom().stream()
                .filter(s -> !reserved.contains(s.getId()))
                .findFirst()
                .orElse(null);
    }

    private String formatScheduleSummary(List<ClassSchedule> schedules) {
        if (schedules.isEmpty()) {
            return "등록된 수업 없음 (자유 시간 위주로 추천)";
        }
        StringBuilder sb = new StringBuilder();
        for (ClassSchedule schedule : schedules) {
            sb.append("- ")
                    .append(schedule.getDayLabel())
                    .append(" ")
                    .append(schedule.getStartTime().toString().substring(0, 5))
                    .append("~")
                    .append(schedule.getEndTime().toString().substring(0, 5))
                    .append(" ")
                    .append(schedule.getSubjectName())
                    .append("\n");
        }
        return sb.toString().trim();
    }

    private String fallbackComment(StudyWindow window) {
        String template = FALLBACK_COMMENTS.getOrDefault(window.tag(), FALLBACK_COMMENTS.get("free_time"));
        String subject = window.afterSubject() != null ? window.afterSubject() : "직전 수업";
        return template.replace("{subject}", subject);
    }

    private String fallbackSummary(List<ClassSchedule> schedules, List<RecommendationSlot> slots) {
        if (schedules.isEmpty()) {
            return "등록된 수업 시간표가 없어 일반적인 학습 시간대를 추천했습니다. 시간표를 등록하면 수업과 겹치지 않는 맞춤 추천을 받을 수 있습니다.";
        }
        if (slots.isEmpty()) {
            return "앞으로 일주일간 여유로운 학습 시간을 찾기 어렵습니다. 예약을 조정하거나 시간표를 확인해 주세요.";
        }
        return "수업 "
                + schedules.size()
                + "개를 분석해 공백 시간 "
                + slots.size()
                + "곳을 골랐습니다. 수업 직후·오전·저녁 시간대는 기억 정착과 복습에 특히 효과적입니다.";
    }

    private String fallbackStudyTips(List<ClassSchedule> schedules) {
        if (schedules.isEmpty()) {
            return "하루 2~3시간 단위로 목표를 나누고, 스터디룸 예약 후 바로 시작하세요. 짧은 세션도 타이머와 요약 노트를 함께 쓰면 효율이 올라갑니다.";
        }
        return "수업 직후 1~2시간은 복습 골든타임입니다. 긴 공백은 심화 학습, 저녁은 하루 정리에 쓰고, 포모도로(25분 집중 + 5분 휴식)와 액티브 리콜을 병행해 보세요.";
    }

    private RecommendationResult.RecommendationResultBuilder baseResult(
            List<ClassSchedule> schedules,
            String scheduleSummary,
            ScheduleGridService.WeeklyGrid grid) {
        return RecommendationResult.builder()
                .scheduleSummary(scheduleSummary)
                .grid(grid)
                .hasSchedules(!schedules.isEmpty())
                .geminiConfigured(geminiClient.isConfigured());
    }

    private String stringValue(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? fallback : text;
    }

    public record RecommendationSlot(
            String date,
            String dayLabel,
            String startTime,
            String endTime,
            String title,
            String tag,
            String afterSubject,
            String comment,
            String studyMethod,
            Long seatId,
            String roomName,
            String seatNumber) {}

    @lombok.Builder
    @lombok.Getter
    public static class RecommendationResult {
        private String summary;
        private String studyTips;
        private List<RecommendationSlot> slots;
        private boolean llmUsed;
        private String llmStatus;
        private String scheduleSummary;
        private ScheduleGridService.WeeklyGrid grid;
        private boolean hasSchedules;
        private boolean geminiConfigured;
    }
}
