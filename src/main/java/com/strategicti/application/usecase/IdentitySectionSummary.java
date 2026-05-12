package com.strategicti.application.usecase;

import com.strategicti.domain.model.StrategicObjective;

import java.time.Instant;
import java.util.List;

public record IdentitySectionSummary(
        Long planId,
        Long groupId,
        String mission,
        String vision,
        String valuesText,
        List<StrategicObjective> objectives,
        Instant updatedAt
) {
}
