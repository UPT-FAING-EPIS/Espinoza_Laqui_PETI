package com.strategicti.application.usecase;

import com.strategicti.domain.model.ValueChainActivity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ValueChainAssessmentCommand(
        @NotNull ValueChainActivity activity,
        @Size(max = 1000) String statement,
        @Min(0) @Max(4) int score,
        @Size(max = 1000) String notes
) {
}
