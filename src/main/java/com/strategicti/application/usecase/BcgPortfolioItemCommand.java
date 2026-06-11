package com.strategicti.application.usecase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record BcgPortfolioItemCommand(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 1000) String description,
        @PositiveOrZero double annualSales,
        double marketGrowthRate,
        @PositiveOrZero double relativeMarketShare,
        @Size(max = 1000) String notes
) {
}
