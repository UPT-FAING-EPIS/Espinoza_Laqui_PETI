package com.strategicti.domain.model;

import java.time.Instant;
import java.util.List;

public record BcgPortfolioItem(
        Long id,
        Long planId,
        String name,
        String description,
        double annualSales,
        double salesPercentage,
        double marketGrowthRate,
        double relativeMarketShare,
        List<Double> marketGrowthRates,
        List<Double> sectorDemandValues,
        List<BcgCompetitorSale> competitors,
        double largestCompetitorSales,
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
        marketGrowthRates = cleanNumberList(marketGrowthRates, false);
        sectorDemandValues = cleanNumberList(sectorDemandValues, true);
        competitors = cleanCompetitors(competitors);
        marketGrowthRate = marketGrowthFromRates(marketGrowthRates, marketGrowthRate);
        relativeMarketShare = relativeMarketShareFromCompetitors(annualSales, competitors, relativeMarketShare);
        if (relativeMarketShare < 0) {
            throw new IllegalArgumentException("La participacion relativa no puede ser negativa.");
        }
        if (largestCompetitorSales < 0) {
            throw new IllegalArgumentException("Las ventas del mayor competidor no pueden ser negativas.");
        }
        largestCompetitorSales = largestCompetitorSales == 0
                ? largestCompetitorSales(competitors)
                : round(largestCompetitorSales);
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
                List.of(),
                List.of(),
                List.of(),
                0,
                marketGrowthThreshold,
                relativeMarketShareThreshold,
                quadrant,
                BcgStrategicDecision.fromQuadrant(quadrant),
                notes,
                position,
                Instant.now()
        );
    }

    public static BcgPortfolioItem create(
            Long planId,
            String name,
            String description,
            double annualSales,
            double salesPercentage,
            double marketGrowthRate,
            double relativeMarketShare,
            List<Double> marketGrowthRates,
            List<Double> sectorDemandValues,
            List<BcgCompetitorSale> competitors,
            double marketGrowthThreshold,
            double relativeMarketShareThreshold,
            String notes,
            int position
    ) {
        double calculatedGrowth = marketGrowthFromRates(marketGrowthRates, marketGrowthRate);
        double calculatedShare = relativeMarketShareFromCompetitors(annualSales, competitors, relativeMarketShare);
        BcgQuadrant quadrant = classify(calculatedGrowth, calculatedShare, marketGrowthThreshold, relativeMarketShareThreshold);
        return new BcgPortfolioItem(
                null,
                planId,
                name,
                description,
                annualSales,
                salesPercentage,
                calculatedGrowth,
                calculatedShare,
                marketGrowthRates,
                sectorDemandValues,
                competitors,
                largestCompetitorSales(competitors),
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

    public static double marketGrowthFromRates(List<Double> rates, double fallback) {
        List<Double> cleanRates = cleanNumberList(rates, false);
        if (cleanRates.isEmpty()) {
            return fallback;
        }
        double average = cleanRates.stream().mapToDouble(Double::doubleValue).average().orElse(fallback);
        return round(average);
    }

    public static double relativeMarketShareFromCompetitors(
            double annualSales,
            List<BcgCompetitorSale> competitors,
            double fallback
    ) {
        double largestCompetitorSales = largestCompetitorSales(competitors);
        if (largestCompetitorSales <= 0) {
            return fallback;
        }
        return round(annualSales / largestCompetitorSales);
    }

    public static double largestCompetitorSales(List<BcgCompetitorSale> competitors) {
        return cleanCompetitors(competitors).stream()
                .mapToDouble(BcgCompetitorSale::sales)
                .max()
                .orElse(0);
    }

    private static List<Double> cleanNumberList(List<Double> values, boolean requireNonNegative) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && Double.isFinite(value))
                .map(value -> {
                    if (requireNonNegative && value < 0) {
                        throw new IllegalArgumentException("Los valores BCG no pueden ser negativos.");
                    }
                    return round(value);
                })
                .toList();
    }

    private static List<BcgCompetitorSale> cleanCompetitors(List<BcgCompetitorSale> competitors) {
        if (competitors == null) {
            return List.of();
        }
        return competitors.stream()
                .filter(competitor -> competitor != null && competitor.sales() >= 0)
                .map(competitor -> new BcgCompetitorSale(competitor.name(), competitor.sales()))
                .toList();
    }

    private static double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
