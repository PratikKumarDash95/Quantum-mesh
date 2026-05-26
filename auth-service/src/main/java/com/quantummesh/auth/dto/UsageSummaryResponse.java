package com.quantummesh.auth.dto;

import java.util.List;
import java.util.Map;

public record UsageSummaryResponse(
        double todayCostUsd,
        double monthCostUsd,
        long todayRequests,
        long monthRequests,
        Map<String, Long> requestsByService,
        List<UsageBucket> timeseries
) {
    public record UsageBucket(String bucket, long requests, double costUsd) {}
}
