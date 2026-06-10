package com.strategicti.application.usecase;

import com.strategicti.domain.model.PestFactor;

public record PestFactorSummary(
        PestFactor factor,
        String label,
        int answeredQuestions,
        int score,
        int maxScore,
        double impactLevel,
        int impactPercentage,
        boolean notableImpact
) {
}
