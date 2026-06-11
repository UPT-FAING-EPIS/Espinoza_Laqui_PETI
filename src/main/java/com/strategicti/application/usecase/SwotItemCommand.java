package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SwotItemCommand(
        @Size(max = 1000) String description,
        @NotNull DiagnosticPriority priority
) {
}
