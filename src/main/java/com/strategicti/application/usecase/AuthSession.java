package com.strategicti.application.usecase;

public record AuthSession(
        String tokenType,
        String accessToken,
        long expiresInSeconds,
        UserSummary user
) {
}
