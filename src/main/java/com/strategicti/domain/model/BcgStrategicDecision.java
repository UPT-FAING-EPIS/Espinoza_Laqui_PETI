package com.strategicti.domain.model;

public enum BcgStrategicDecision {
    POTENCIAR("crecer o mantenerse"),
    EVALUAR("crecer"),
    MANTENER("mantenerse"),
    REESTRUCTURAR_O_DESINVERTIR("cosechar o desinvertir");

    private final String label;

    BcgStrategicDecision(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public static BcgStrategicDecision fromQuadrant(BcgQuadrant quadrant) {
        return switch (quadrant) {
            case ESTRELLA -> POTENCIAR;
            case INCOGNITA -> EVALUAR;
            case VACA -> MANTENER;
            case PERRO -> REESTRUCTURAR_O_DESINVERTIR;
        };
    }
}
