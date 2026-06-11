package com.strategicti.application.usecase;

import com.strategicti.domain.model.PorterForce;

public record PorterForceSummary(
        PorterForce force,
        String label,
        int answeredQuestions,
        int score,
        int maxScore,
        double pressureLevel,
        int pressurePercentage,
        boolean highPressure
) {
}
