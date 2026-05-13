package com.strategicti.application.usecase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PhaseChangeEntryCommand(
        @NotBlank @Size(max = 120) String fieldKey,
        @Size(max = 5000) String previousValue,
        @Size(max = 5000) String proposedValue
) {
}
