package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record CameSummary(
        Long planId,
        List<CameActionSummary> corregir,
        List<CameActionSummary> afrontar,
        List<CameActionSummary> mantener,
        List<CameActionSummary> explotar,
        Instant updatedAt
) {}
