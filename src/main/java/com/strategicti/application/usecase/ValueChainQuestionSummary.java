package com.strategicti.application.usecase;

import com.strategicti.domain.model.ValueChainActivity;
import com.strategicti.domain.model.ValueChainDimension;

import java.util.Set;

public record ValueChainQuestionSummary(
        int questionNumber,
        ValueChainActivity activity,
        Set<ValueChainDimension> dimensions,
        String statement,
        Integer score
) {
}
