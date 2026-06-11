package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CameActionCommand(
        @NotBlank @Size(max = 1000) String description,
        @Size(max = 300) String relatedFactor,
        @NotNull DiagnosticPriority priority
) {}
