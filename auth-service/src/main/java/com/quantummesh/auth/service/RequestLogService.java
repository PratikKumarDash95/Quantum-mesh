package com.quantummesh.auth.service;

import com.quantummesh.auth.dto.RequestLogIngestRequest;
import com.quantummesh.auth.dto.RequestLogView;
import com.quantummesh.auth.dto.UsageSummaryResponse;
import com.quantummesh.auth.entity.RequestLog;
import com.quantummesh.auth.entity.User;
import com.quantummesh.auth.repository.RequestLogRepository;
import com.quantummesh.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestLogService {

    private static final long COST_FREE_MICROS = 100L;
    private static final long COST_PREMIUM_MICROS = 500L;
    private static final long COST_ADMIN_MICROS = 0L;

    private final RequestLogRepository requestLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public void ingest(RequestLogIngestRequest req) {
        if (req.username() == null || req.username().isBlank()) {
            return;
        }
        Optional<User> userOpt = userRepository.findByUsername(req.username());
        if (userOpt.isEmpty()) {
            log.debug("ingest: unknown user {}", req.username());
            return;
        }
        long cost = costFor(req.tier());
        RequestLog entry = RequestLog.builder()
                .userId(userOpt.get().getId())
                .apiKeyPrefix(req.apiKeyPrefix())
                .method(req.method() == null ? "GET" : req.method())
                .path(truncate(req.path(), 512))
                .downstreamService(req.downstreamService() == null ? "unknown" : req.downstreamService())
                .statusCode(req.statusCode() == null ? 0 : req.statusCode())
                .latencyMs(req.latencyMs() == null ? 0 : req.latencyMs())
                .costMicros(cost)
                .timestamp(Instant.now())
                .build();
        requestLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<RequestLogView> listForUser(User user, int limit, String statusFilter, String serviceFilter) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return requestLogRepository
                .findByUserIdOrderByTimestampDesc(user.getId(),
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "timestamp")))
                .stream()
                .filter(r -> statusFilter == null || statusFilter.isBlank()
                        || matchesStatus(r.getStatusCode(), statusFilter))
                .filter(r -> serviceFilter == null || serviceFilter.isBlank()
                        || serviceFilter.equalsIgnoreCase(r.getDownstreamService()))
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsageSummaryResponse summarizeForUser(User user) {
        Instant now = Instant.now();
        Instant startOfToday = now.atZone(ZoneOffset.UTC).toLocalDate()
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startOfMonth = now.atZone(ZoneOffset.UTC).toLocalDate().withDayOfMonth(1)
                .atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant last24h = now.minus(24, ChronoUnit.HOURS);

        long todayMicros = requestLogRepository.sumCostMicrosByUserSince(user.getId(), startOfToday);
        long monthMicros = requestLogRepository.sumCostMicrosByUserSince(user.getId(), startOfMonth);
        long todayReq = requestLogRepository.countByUserSince(user.getId(), startOfToday);
        long monthReq = requestLogRepository.countByUserSince(user.getId(), startOfMonth);

        Map<String, Long> byService = new LinkedHashMap<>();
        for (var row : requestLogRepository.countByServiceForUserSince(user.getId(), startOfMonth)) {
            byService.put(row.getService(), row.getCount());
        }

        List<RequestLog> recent = requestLogRepository.findRecentForUser(user.getId(), last24h);
        List<UsageSummaryResponse.UsageBucket> buckets = bucketByHour(recent, now);

        return new UsageSummaryResponse(
                microsToUsd(todayMicros),
                microsToUsd(monthMicros),
                todayReq,
                monthReq,
                byService,
                buckets
        );
    }

    private List<UsageSummaryResponse.UsageBucket> bucketByHour(List<RequestLog> entries, Instant now) {
        long[] counts = new long[24];
        long[] costs = new long[24];
        Instant cutoff = now.minus(24, ChronoUnit.HOURS).truncatedTo(ChronoUnit.HOURS);
        for (RequestLog r : entries) {
            long hoursAgo = ChronoUnit.HOURS.between(
                    r.getTimestamp().truncatedTo(ChronoUnit.HOURS),
                    now.truncatedTo(ChronoUnit.HOURS));
            int idx = (int) (23 - hoursAgo);
            if (idx >= 0 && idx < 24) {
                counts[idx]++;
                costs[idx] += r.getCostMicros();
            }
        }
        List<UsageSummaryResponse.UsageBucket> out = new ArrayList<>(24);
        for (int i = 0; i < 24; i++) {
            Instant bucketStart = cutoff.plus(i, ChronoUnit.HOURS);
            out.add(new UsageSummaryResponse.UsageBucket(
                    bucketStart.toString(),
                    counts[i],
                    microsToUsd(costs[i])
            ));
        }
        return out;
    }

    private long costFor(String tier) {
        if (tier == null) return COST_FREE_MICROS;
        String upper = tier.toUpperCase();
        if (upper.contains("ADMIN")) return COST_ADMIN_MICROS;
        if (upper.contains("PREMIUM")) return COST_PREMIUM_MICROS;
        return COST_FREE_MICROS;
    }

    private double microsToUsd(long micros) {
        return Math.round(micros / 1000.0) / 1000.0;
    }

    private boolean matchesStatus(int code, String filter) {
        if (filter.equalsIgnoreCase("2xx")) return code >= 200 && code < 300;
        if (filter.equalsIgnoreCase("4xx")) return code >= 400 && code < 500;
        if (filter.equalsIgnoreCase("5xx")) return code >= 500 && code < 600;
        try {
            return code == Integer.parseInt(filter);
        } catch (NumberFormatException ignored) {
            return true;
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max);
    }

    private RequestLogView toView(RequestLog r) {
        return new RequestLogView(
                r.getId(),
                r.getMethod(),
                r.getPath(),
                r.getDownstreamService(),
                r.getApiKeyPrefix(),
                r.getStatusCode(),
                r.getLatencyMs(),
                r.getCostMicros(),
                r.getTimestamp()
        );
    }
}
