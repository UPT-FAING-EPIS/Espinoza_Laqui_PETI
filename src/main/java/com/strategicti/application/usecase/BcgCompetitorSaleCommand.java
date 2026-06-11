package com.strategicti.application.usecase;

import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record BcgCompetitorSaleCommand(
        @Size(max = 160) String name,
        @PositiveOrZero double sales
) {
}
