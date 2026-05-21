package com.strategicti.application.usecase;

import com.strategicti.domain.model.ValueChainActivity;

public record ValueChainAssessmentSummary(
        Long id,
        ValueChainActivity activity,
        String statement,
        int score,
        String notes,
        int position
) {
}
