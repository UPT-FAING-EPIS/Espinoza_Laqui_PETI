package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record SwotSummary(
        Long planId,
        List<SwotItemSummary> strengths,
        List<SwotItemSummary> opportunities,
        List<SwotItemSummary> weaknesses,
        List<SwotItemSummary> threats,
        Instant updatedAt
) {
}
