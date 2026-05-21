package com.strategicti.application.usecase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateBcgCommand(
        List<@Valid BcgPortfolioItemCommand> products,
        Double marketGrowthThreshold,
        @Positive Double relativeMarketShareThreshold,
        @Size(max = 1000) String observations,
        List<@Size(max = 1000) String> strengths,
        List<@Size(max = 1000) String> weaknesses
) {
}
