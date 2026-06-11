package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.SwotCategory;

public record SwotItemSummary(
        Long id,
        SwotCategory category,
        String description,
        DiagnosticPriority priority,
        int position
) {
}
