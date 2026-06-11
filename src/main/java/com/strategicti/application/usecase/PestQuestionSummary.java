package com.strategicti.application.usecase;

import com.strategicti.domain.model.PestFactor;

public record PestQuestionSummary(
        int questionNumber,
        PestFactor factor,
        String statement,
        Integer score
) {
}
