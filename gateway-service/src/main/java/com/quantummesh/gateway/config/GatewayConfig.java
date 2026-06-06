package com.quantummesh.gateway.config;

import com.quantummesh.gateway.filter.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Value("${AI_ENGINE_HOST:localhost}")
    private String aiEngineHost;

    @Bean
    public RouteLocator routes(
            RouteLocatorBuilder builder,
            JwtAuthenticationFilter jwt
    ) {
        JwtAuthenticationFilter.Config jwtCfg = new JwtAuthenticationFilter.Config();
        String aiUri = "http://" + aiEngineHost + ":8000";

        return builder.routes()
                .route("auth-public-v1", r -> r
                        .path("/api/v1/auth/register",
                              "/api/v1/auth/login",
                              "/api/v1/auth/refresh",
                              "/api/v1/auth/validate",
                              "/api/v1/auth/exchange")
                        .uri("lb://auth-service"))
                .route("auth-secure-v1", r -> r
                        .path("/api/v1/auth/logout",
                              "/api/v1/auth/api-keys",
                              "/api/v1/auth/api-keys/**",
                              "/api/v1/usage/**")
                        .filters(f -> f.filter(jwt.apply(jwtCfg)))
                        .uri("lb://auth-service"))
                .route("monitoring-v1", r -> r
                        .path("/api/v1/monitoring/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .circuitBreaker(c -> c.setName("monitoringCB").setFallbackUri("forward:/fallback/monitoring")))
                        .uri("lb://monitoring-service"))
                .route("analytics-v1", r -> r
                        .path("/api/v1/analytics/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .circuitBreaker(c -> c.setName("analyticsCB").setFallbackUri("forward:/fallback/analytics")))
                        .uri("lb://analytics-service"))
                .route("notifications-v1", r -> r
                        .path("/api/v1/notifications/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .circuitBreaker(c -> c.setName("notificationCB").setFallbackUri("forward:/fallback/notifications")))
                        .uri("lb://notification-service"))
                .route("ai-v1", r -> r
                        .path("/api/v1/ai/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .rewritePath("/api/v1/ai/(?<rest>.*)", "/api/ai/${rest}")
                                .circuitBreaker(c -> c.setName("aiCB").setFallbackUri("forward:/fallback/ai")))
                        .uri(aiUri))
                .route("auth-legacy", r -> r
                        .path("/api/auth/**")
                        .filters(f -> f
                                .addResponseHeader("Deprecation", "true")
                                .addResponseHeader("Sunset", "v2.0.0")
                                .rewritePath("/api/auth/(?<rest>.*)", "/api/v1/auth/${rest}"))
                        .uri("lb://auth-service"))
                .route("monitoring-legacy", r -> r
                        .path("/api/monitoring/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .addResponseHeader("Deprecation", "true")
                                .rewritePath("/api/monitoring/(?<rest>.*)", "/api/v1/monitoring/${rest}"))
                        .uri("lb://monitoring-service"))
                .route("analytics-legacy", r -> r
                        .path("/api/analytics/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .addResponseHeader("Deprecation", "true")
                                .rewritePath("/api/analytics/(?<rest>.*)", "/api/v1/analytics/${rest}"))
                        .uri("lb://analytics-service"))
                .route("notifications-legacy", r -> r
                        .path("/api/notifications/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .addResponseHeader("Deprecation", "true")
                                .rewritePath("/api/notifications/(?<rest>.*)", "/api/v1/notifications/${rest}"))
                        .uri("lb://notification-service"))
                .route("ai-legacy", r -> r
                        .path("/api/ai/**")
                        .filters(f -> f
                                .filter(jwt.apply(jwtCfg))
                                .addResponseHeader("Deprecation", "true"))
                        .uri(aiUri))
                .build();
    }
}
