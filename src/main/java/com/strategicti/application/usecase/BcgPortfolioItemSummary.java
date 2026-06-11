package com.strategicti.application.usecase;

import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.BcgStrategicDecision;

public record BcgPortfolioItemSummary(
        Long id,
        String name,
        String description,
        double annualSales,
        double salesPercentage,
        double marketGrowthRate,
        double relativeMarketShare,
        BcgQuadrant quadrant,
        BcgStrategicDecision strategicDecision,
        String strategicDecisionLabel,
        String notes,
        int position
) {
}
