package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.ValueChainActivity;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ValueChainActivityCommand(
        @NotNull ValueChainActivity activity,
        @Size(max = 1000) String description,
        @NotNull DiagnosticPriority priority
) {
}
