package com.quantummesh.gateway.loadbalancer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.DefaultResponse;
import org.springframework.cloud.client.loadbalancer.EmptyResponse;
import org.springframework.cloud.client.loadbalancer.Request;
import org.springframework.cloud.client.loadbalancer.Response;
import org.springframework.cloud.loadbalancer.core.ReactorServiceInstanceLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.support.LoadBalancerClientFactory;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Intelligent load balancer that combines:
 *   - Round-robin baseline
 *   - Active-connection awareness (least connections)
 *   - Optional weights from an external traffic optimizer (AI engine)
 *
 * Health/penalty scores can be updated from the monitoring service.
 */
@Slf4j
public class IntelligentLoadBalancer implements ReactorServiceInstanceLoadBalancer {

    private final String serviceId;
    private final ServiceInstanceListSupplier supplier;
    private final AtomicInteger roundRobinPosition = new AtomicInteger(0);

    private static final ConcurrentMap<String, AtomicInteger> ACTIVE_CONNECTIONS = new ConcurrentHashMap<>();
    private static final ConcurrentMap<String, Double> WEIGHTS = new ConcurrentHashMap<>();

    public IntelligentLoadBalancer(LoadBalancerClientFactory factory, String serviceId) {
        this.serviceId = serviceId;
        this.supplier = (factory != null && serviceId != null)
                ? factory.getLazyProvider(serviceId, ServiceInstanceListSupplier.class).getIfAvailable()
                : null;
    }

    public static void setWeight(String instanceId, double weight) {
        WEIGHTS.put(instanceId, weight);
    }

    public static void incrementConnections(String instanceId) {
        ACTIVE_CONNECTIONS.computeIfAbsent(instanceId, k -> new AtomicInteger()).incrementAndGet();
    }

    public static void decrementConnections(String instanceId) {
        AtomicInteger a = ACTIVE_CONNECTIONS.get(instanceId);
        if (a != null) a.decrementAndGet();
    }

    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        if (supplier == null) return Mono.just(new EmptyResponse());
        return supplier.get(request).next().map(this::pick);
    }

    private Response<ServiceInstance> pick(List<ServiceInstance> instances) {
        if (instances == null || instances.isEmpty()) {
            log.warn("No instances available for {}", serviceId);
            return new EmptyResponse();
        }

        ServiceInstance best = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (ServiceInstance instance : instances) {
            String id = instance.getInstanceId() == null
                    ? instance.getHost() + ":" + instance.getPort()
                    : instance.getInstanceId();
            int active = ACTIVE_CONNECTIONS.getOrDefault(id, new AtomicInteger()).get();
            double weight = WEIGHTS.getOrDefault(id, 1.0);
            double score = weight / (1.0 + active);
            if (score > bestScore) {
                bestScore = score;
                best = instance;
            }
        }

        if (best == null) {
            int pos = Math.abs(roundRobinPosition.getAndIncrement() % instances.size());
            best = instances.get(pos);
        }
        return new DefaultResponse(best);
    }
}
