package com.strategicti.domain.model;

import java.time.Instant;

public record DiagnosticAssessment(
        Long id,
        Long planId,
        DiagnosticTool tool,
        String category,
        String statement,
        int score,
        String notes,
        int position,
        Instant updatedAt
) {
    public DiagnosticAssessment {
        if (score < 0 || score > 4) {
            throw new IllegalArgumentException("La puntuacion del diagnostico debe estar entre 0 y 4.");
        }
        notes = notes == null ? "" : notes;
        updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public static DiagnosticAssessment valueChain(
            Long planId,
            ValueChainActivity activity,
            String statement,
            int score,
            String notes,
            int position
    ) {
        return new DiagnosticAssessment(
                null,
                planId,
                DiagnosticTool.VALUE_CHAIN,
                activity.name(),
                statement,
                score,
                notes,
                position,
                Instant.now()
        );
    }
}
