package com.strategicti.application.usecase;

public record PhaseChangeEntrySummary(
        String fieldKey,
        String previousValue,
        String proposedValue
) {
}
