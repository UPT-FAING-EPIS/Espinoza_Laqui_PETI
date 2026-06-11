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

    public static DiagnosticAssessment pest(Long planId, PestQuestion question, int score) {
        return new DiagnosticAssessment(
                null,
                planId,
                DiagnosticTool.PEST,
                question.factor().name(),
                question.statement(),
                score,
                "",
                question.number() - 1,
                Instant.now()
        );
    }

    public static DiagnosticAssessment valueChain(
            Long planId,
            ValueChainQuestion question,
            int score,
            String notes
    ) {
        return new DiagnosticAssessment(
                null,
                planId,
                DiagnosticTool.VALUE_CHAIN,
                question.activity().name(),
                question.statement(),
                score,
                notes,
                question.number() - 1,
                Instant.now()
        );
    }

    public static DiagnosticAssessment porter(Long planId, PorterQuestion question, int score) {
        return new DiagnosticAssessment(
                null,
                planId,
                DiagnosticTool.PORTER,
                question.force().name(),
                question.statement(),
                score,
                "",
                question.number() - 1,
                Instant.now()
        );
    }
}
