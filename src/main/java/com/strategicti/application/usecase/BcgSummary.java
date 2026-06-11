package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record BcgSummary(
        Long planId,
        List<BcgPortfolioItemSummary> products,
        List<DiagnosticFindingSummary> findings,
        String observations,
        List<String> strengths,
        List<String> weaknesses,
        double marketGrowthThreshold,
        double relativeMarketShareThreshold,
        double totalSales,
        int stars,
        int questionMarks,
        int cashCows,
        int dogs,
        Instant updatedAt
) {
}
