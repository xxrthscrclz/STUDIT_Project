package com.studit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;

public final class LlmPrompts {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private LlmPrompts() {}

    public static String buildStudyCommentaryPrompt(
            String scheduleSummary, List<Map<String, Object>> slotPayloads) {
        String slotsJson;
        try {
            slotsJson = MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(slotPayloads);
        } catch (JsonProcessingException ex) {
            slotsJson = "[]";
        }

        return """
                당신은 대학생 학습 코치입니다. 아래 수업 시간표와 추천 학습 시간대를 분석해 한국어로 답변하세요.

                [수업 시간표]
                %s

                [추천 학습 시간대]
                %s

                다음 JSON 형식으로만 답하세요. 다른 텍스트는 포함하지 마세요.
                {
                  "summary": "시간표 전체를 바탕으로 한 2~3문장 요약 코멘트",
                  "study_tips": "이 학생에게 맞는 공부 방식과 루틴을 3~4문장으로 설명",
                  "slots": [
                    {
                      "index": 0,
                      "comment": "해당 시간대를 추천하는 이유 1~2문장",
                      "study_method": "구체적인 공부 방법 1~2문장"
                    }
                  ]
                }
                slots 배열 길이는 추천 시간대 개수와 같아야 하고, index는 0부터 순서대로 작성하세요."""
                .formatted(scheduleSummary, slotsJson);
    }
}
