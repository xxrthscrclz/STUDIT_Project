package com.studit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studit.config.GeminiProperties;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GeminiClient {

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public boolean isConfigured() {
        return properties.getApiKey() != null && !properties.getApiKey().isBlank();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateStudyCommentary(String scheduleSummary, List<Map<String, Object>> slotPayloads)
            throws GeminiException {
        if (!isConfigured()) {
            throw new GeminiException("GEMINI_API_KEY가 설정되지 않았습니다.");
        }

        String prompt = LlmPrompts.buildStudyCommentaryPrompt(scheduleSummary, slotPayloads);
        GeminiException lastError = null;

        for (String model : modelCandidates()) {
            try {
                return callGemini(prompt, model);
            } catch (GeminiException ex) {
                lastError = ex;
                if (!isRetryable(ex)) {
                    throw ex;
                }
            }
        }

        if (lastError != null) {
            throw lastError;
        }
        throw new GeminiException("Gemini API 호출에 실패했습니다.");
    }

    public String errorMessage(GeminiException exc) {
        String message = exc.getMessage() != null ? exc.getMessage() : "";
        String lowered = message.toLowerCase();
        if (message.contains("429") || lowered.contains("quota")) {
            return "Gemini API 할당량 초과 — Google AI Studio에서 새 API 키를 발급하거나 잠시 후 다시 시도해 주세요.";
        }
        if (message.contains("401") || message.contains("403") || lowered.contains("api key")) {
            return "Gemini API 키가 유효하지 않습니다. GEMINI_API_KEY를 AI Studio에서 발급한 키(AIza...)로 교체해 주세요.";
        }
        if (message.contains("503") || lowered.contains("high demand")) {
            return "Gemini 서버가 일시적으로 바쁩니다. 잠시 후 다시 추천받기를 눌러 주세요.";
        }
        if (isConfigured()) {
            return "Gemini API 연결 실패 — 시간표 기반 추천을 사용했습니다. GEMINI_API_KEY를 확인해 주세요.";
        }
        return "GEMINI_API_KEY를 설정하면 Gemini AI 코멘트를 받을 수 있습니다.";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callGemini(String prompt, String model) throws GeminiException {
        try {
            String query = "key=" + URLEncoder.encode(properties.getApiKey(), StandardCharsets.UTF_8);
            String url =
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                            + model
                            + ":generateContent?"
                            + query;

            Map<String, Object> payload =
                    Map.of(
                            "contents",
                            List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                            "generationConfig",
                            Map.of("temperature", 0.7, "responseMimeType", "application/json"));

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                            .header("Content-Type", "application/json")
                            .POST(
                                    HttpRequest.BodyPublishers.ofString(
                                            objectMapper.writeValueAsString(payload)))
                            .build();

            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                String detail = response.body();
                throw new GeminiException(
                        "Gemini API 오류 (" + response.statusCode() + "): " + detail.substring(0, Math.min(200, detail.length())));
            }

            JsonNode body = objectMapper.readTree(response.body());
            JsonNode candidates = body.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new GeminiException("Gemini 응답이 비어 있습니다.");
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new GeminiException("Gemini 응답 본문이 비어 있습니다.");
            }
            String raw = parts.get(0).path("text").asText("").trim();
            if (raw.isEmpty()) {
                throw new GeminiException("Gemini 응답 텍스트가 비어 있습니다.");
            }
            return parseJsonResponse(raw);
        } catch (GeminiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new GeminiException("Gemini API에 연결할 수 없습니다.", ex);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonResponse(String rawText) throws GeminiException {
        String text = rawText.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "");
            text = text.replaceFirst("\\s*```$", "");
        }
        try {
            return objectMapper.readValue(text, Map.class);
        } catch (Exception ex) {
            throw new GeminiException("Gemini JSON 응답을 해석할 수 없습니다.", ex);
        }
    }

    private Set<String> modelCandidates() {
        Set<String> models = new LinkedHashSet<>();
        models.add(properties.getModel());
        models.add("gemini-2.5-flash-lite");
        models.add("gemini-flash-latest");
        models.add("gemini-2.5-flash");
        return models;
    }

    private boolean isRetryable(GeminiException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "";
        return message.contains("429") || message.contains("503") || message.contains("500");
    }

    public static class GeminiException extends Exception {
        public GeminiException(String message) {
            super(message);
        }

        public GeminiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
