package com.strategicti.domain.model;

public record BcgCompetitorSale(
        String name,
        double sales
) {
    public BcgCompetitorSale {
        if (sales < 0) {
            throw new IllegalArgumentException("Las ventas del competidor no pueden ser negativas.");
        }
        name = name == null ? "" : name.strip();
    }
}
