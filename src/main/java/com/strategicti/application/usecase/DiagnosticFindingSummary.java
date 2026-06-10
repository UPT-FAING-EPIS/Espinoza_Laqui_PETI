package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.SwotCategory;

import java.time.Instant;

public record DiagnosticFindingSummary(
        Long id,
        DiagnosticTool source,
        String sourceDimension,
        SwotCategory category,
        String description,
        String evidence,
        String impact,
        DiagnosticPriority priority,
        boolean selectedForFoda,
        Long createdByUserId,
        int position,
        Instant createdAt,
        Instant updatedAt
) {
}
