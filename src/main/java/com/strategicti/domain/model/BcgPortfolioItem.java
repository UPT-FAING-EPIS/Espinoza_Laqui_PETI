package com.strategicti.domain.model;

import java.time.Instant;

public record BcgPortfolioItem(
        Long id,
        Long planId,
        String name,
        String description,
        double annualSales,
        double salesPercentage,
        double marketGrowthRate,
        double relativeMarketShare,
        double marketGrowthThreshold,
        double relativeMarketShareThreshold,
        BcgQuadrant quadrant,
        BcgStrategicDecision strategicDecision,
        String notes,
        int position,
        Instant updatedAt
) {
    public static final double DEFAULT_MARKET_GROWTH_THRESHOLD = 10.0;
    public static final double DEFAULT_RELATIVE_MARKET_SHARE_THRESHOLD = 1.0;

    public BcgPortfolioItem {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("El producto o servicio BCG es obligatorio.");
        }
        if (annualSales < 0) {
            throw new IllegalArgumentException("Las ventas del producto o servicio no pueden ser negativas.");
        }
        if (salesPercentage < 0) {
            throw new IllegalArgumentException("El porcentaje de ventas no puede ser negativo.");
        }
        if (relativeMarketShare < 0) {
            throw new IllegalArgumentException("La participacion relativa no puede ser negativa.");
        }
        if (relativeMarketShareThreshold <= 0) {
            throw new IllegalArgumentException("El umbral de participacion relativa debe ser mayor a cero.");
        }
        description = description == null ? "" : description;
        notes = notes == null ? "" : notes;
        quadrant = quadrant == null
                ? classify(marketGrowthRate, relativeMarketShare, marketGrowthThreshold, relativeMarketShareThreshold)
                : quadrant;
        strategicDecision = strategicDecision == null ? BcgStrategicDecision.fromQuadrant(quadrant) : strategicDecision;
        updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public static BcgPortfolioItem create(
            Long planId,
            String name,
            String description,
            double annualSales,
            double salesPercentage,
            double marketGrowthRate,
            double relativeMarketShare,
            double marketGrowthThreshold,
            double relativeMarketShareThreshold,
            String notes,
            int position
    ) {
        BcgQuadrant quadrant = classify(marketGrowthRate, relativeMarketShare, marketGrowthThreshold, relativeMarketShareThreshold);
        return new BcgPortfolioItem(
                null,
                planId,
                name,
                description,
                annualSales,
                salesPercentage,
                marketGrowthRate,
                relativeMarketShare,
                marketGrowthThreshold,
                relativeMarketShareThreshold,
                quadrant,
                BcgStrategicDecision.fromQuadrant(quadrant),
                notes,
                position,
                Instant.now()
        );
    }

    public static BcgQuadrant classify(double marketGrowthRate, double relativeMarketShare) {
        return classify(
                marketGrowthRate,
                relativeMarketShare,
                DEFAULT_MARKET_GROWTH_THRESHOLD,
                DEFAULT_RELATIVE_MARKET_SHARE_THRESHOLD
        );
    }

    public static BcgQuadrant classify(
            double marketGrowthRate,
            double relativeMarketShare,
            double marketGrowthThreshold,
            double relativeMarketShareThreshold
    ) {
        if (relativeMarketShareThreshold <= 0) {
            throw new IllegalArgumentException("El umbral de participacion relativa debe ser mayor a cero.");
        }
        boolean highGrowth = marketGrowthRate >= marketGrowthThreshold;
        boolean highShare = relativeMarketShare >= relativeMarketShareThreshold;
        if (highGrowth && highShare) {
            return BcgQuadrant.ESTRELLA;
        }
        if (highGrowth) {
            return BcgQuadrant.INCOGNITA;
        }
        if (highShare) {
            return BcgQuadrant.VACA;
        }
        return BcgQuadrant.PERRO;
    }
}
