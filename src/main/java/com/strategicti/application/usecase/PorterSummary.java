package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record PorterSummary(
        Long planId,
        List<PorterQuestionSummary> questions,
        List<PorterForceSummary> forces,
        List<DiagnosticFindingSummary> findings,
        int answeredQuestions,
        int overallScore,
        int maxOverallScore,
        int pressurePercentage,
        String conclusion,
        boolean complete,
        Instant updatedAt
) {
}
