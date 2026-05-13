package com.strategicti.domain.model;

public record PlanPhaseChangeEntry(
        String fieldKey,
        String previousValue,
        String proposedValue
) {
}
