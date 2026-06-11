package com.strategicti.application.usecase;

import com.strategicti.domain.model.PetiPhase;
import tools.jackson.databind.JsonNode;

import java.time.Instant;

public record PhaseVersionSummary(
        Long id,
        Long planId,
        PetiPhase phase,
        int versionNumber,
        boolean official,
        Long sourceChangeRequestId,
        JsonNode content,
        Long createdByUserId,
        Long approvedByUserId,
        Instant createdAt,
        Instant approvedAt
) {
}
