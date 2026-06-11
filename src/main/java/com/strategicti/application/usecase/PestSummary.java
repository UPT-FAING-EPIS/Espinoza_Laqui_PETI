package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record PestSummary(
        Long planId,
        List<PestQuestionSummary> questions,
        List<PestFactorSummary> factors,
        List<DiagnosticFindingSummary> findings,
        int answeredQuestions,
        boolean complete,
        Instant updatedAt
) {
}
