package com.studit.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({JwtProperties.class, GeminiProperties.class, CorsProperties.class})
public class AppConfig {}
