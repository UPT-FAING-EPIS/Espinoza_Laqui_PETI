package com.strategicti.application.usecase;

import com.strategicti.domain.model.ValueChainDimension;

public record ValueChainDimensionSummary(
        ValueChainDimension dimension,
        String code,
        String label,
        int answeredQuestions,
        int score,
        int maxScore,
        int maturityPercentage,
        int improvementPercentage
) {
}
