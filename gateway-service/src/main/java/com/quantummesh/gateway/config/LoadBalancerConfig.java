package com.quantummesh.gateway.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class LoadBalancerConfig {
    // Using Spring Cloud's default round-robin load balancer.
    // Custom IntelligentLoadBalancer disabled — it requires AI engine integration
    // that isn't available in the auth-only stack.
}
