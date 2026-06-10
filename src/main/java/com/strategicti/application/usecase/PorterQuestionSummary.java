package com.strategicti.application.usecase;

import com.strategicti.domain.model.PorterForce;

public record PorterQuestionSummary(
        int questionNumber,
        PorterForce force,
        String statement,
        Integer score
) {
}
