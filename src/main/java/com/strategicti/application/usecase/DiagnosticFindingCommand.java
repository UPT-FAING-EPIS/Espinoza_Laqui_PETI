package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.SwotCategory;

public record DiagnosticFindingCommand(
        String sourceDimension,
        SwotCategory category,
        String description,
        String evidence,
        String impact,
        DiagnosticPriority priority,
        boolean selectedForFoda
) {
}
