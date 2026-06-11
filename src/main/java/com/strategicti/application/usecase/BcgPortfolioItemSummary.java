package com.strategicti.application.usecase;

import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.BcgStrategicDecision;

import java.util.List;

public record BcgPortfolioItemSummary(
        Long id,
        String name,
        String description,
        double annualSales,
        double salesPercentage,
        double marketGrowthRate,
        double relativeMarketShare,
        List<Double> marketGrowthRates,
        List<Double> sectorDemandValues,
        List<BcgCompetitorSaleSummary> competitors,
        double largestCompetitorSales,
        BcgQuadrant quadrant,
        BcgStrategicDecision strategicDecision,
        String strategicDecisionLabel,
        String notes,
        int position
) {
}
