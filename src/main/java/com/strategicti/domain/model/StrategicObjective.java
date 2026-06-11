package com.strategicti.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

public record StrategicObjective(
        String generalObjective,
        List<String> specificObjectives
) {
    public StrategicObjective {
        specificObjectives = specificObjectives == null ? List.of() : List.copyOf(specificObjectives);
    }

    @JsonIgnore
    public boolean isComplete() {
        return hasText(generalObjective) && specificObjectives.stream().anyMatch(this::hasText);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
