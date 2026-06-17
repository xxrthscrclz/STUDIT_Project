package com.studit.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix = "app.gemini")
@Getter
@Setter
public class GeminiProperties {
    private String apiKey = "";
    private String model = "gemini-2.5-flash-lite";
    private int timeoutSeconds = 30;
}
