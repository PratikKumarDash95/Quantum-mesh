package com.quantummesh.auth.dto;

public record ApiKeyCreatedResponse(ApiKeyView meta, String plaintextKey) {}
