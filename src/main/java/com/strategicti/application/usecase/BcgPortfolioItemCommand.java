package com.strategicti.application.usecase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;

import java.util.List;

public record BcgPortfolioItemCommand(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 1000) String description,
        @PositiveOrZero double annualSales,
        double marketGrowthRate,
        @PositiveOrZero double relativeMarketShare,
        List<Double> marketGrowthRates,
        List<@PositiveOrZero Double> sectorDemandValues,
        @Size(max = 9) List<@Valid BcgCompetitorSaleCommand> competitors,
        @Size(max = 1000) String notes
) {
}
