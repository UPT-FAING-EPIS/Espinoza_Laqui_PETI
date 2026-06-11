package com.strategicti.application.usecase;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PorterResponseCommand(
        @Min(1) @Max(25) int questionNumber,
        @NotNull @Min(0) @Max(4) Integer score
) {
}
