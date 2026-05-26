package com.quantummesh.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ApiKeyCreateRequest(
        @NotBlank @Size(max = 80) String name,
        String tier,
        Integer ttlDays
) {}
