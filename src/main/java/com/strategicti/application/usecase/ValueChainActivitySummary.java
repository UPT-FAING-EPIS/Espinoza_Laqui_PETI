package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.ValueChainActivity;
import com.strategicti.domain.model.ValueChainActivityType;

public record ValueChainActivitySummary(
        Long id,
        ValueChainActivity activity,
        ValueChainActivityType type,
        String description,
        DiagnosticPriority priority,
        int position
) {
}
