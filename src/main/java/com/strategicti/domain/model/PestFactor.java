package com.strategicti.domain.model;

public enum PestFactor {
    SOCIAL_DEMOGRAPHIC("Factores sociales y demograficos"),
    ENVIRONMENTAL("Factores medioambientales"),
    POLITICAL("Factores politicos"),
    ECONOMIC("Factores economicos"),
    TECHNOLOGICAL("Factores tecnologicos");

    private final String label;

    PestFactor(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
