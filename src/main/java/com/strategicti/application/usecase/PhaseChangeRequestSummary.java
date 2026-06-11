package com.strategicti.application.usecase;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.List;

public record PhaseChangeRequestSummary(
        Long id,
        Long planId,
        PetiPhase phase,
        PhaseChangeStatus status,
        String title,
        String description,
        JsonNode proposedContent,
        List<PhaseChangeEntrySummary> entries,
        Long createdByUserId,
        Instant createdAt,
        Instant submittedAt,
        Long reviewedByUserId,
        Instant reviewedAt,
        String reviewComment,
        Instant updatedAt
) {
}
