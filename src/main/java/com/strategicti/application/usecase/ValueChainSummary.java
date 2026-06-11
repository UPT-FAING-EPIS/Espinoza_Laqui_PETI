package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record ValueChainSummary(
        Long planId,
        List<ValueChainQuestionSummary> questions,
        List<ValueChainDimensionSummary> dimensions,
        List<DiagnosticFindingSummary> findings,
        List<ValueChainActivitySummary> supportActivities,
        List<ValueChainActivitySummary> primaryActivities,
        List<ValueChainAssessmentSummary> assessments,
        String observations,
        List<String> strengths,
        List<String> weaknesses,
        int totalScore,
        int maxScore,
        int scorePercentage,
        int answeredQuestions,
        int improvementPercentage,
        boolean complete,
        String conclusion,
        Instant updatedAt
) {
}
