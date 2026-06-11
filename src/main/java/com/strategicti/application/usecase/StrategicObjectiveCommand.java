package com.strategicti.application.usecase;

import jakarta.validation.constraints.Size;

import java.util.List;

public record StrategicObjectiveCommand(
        @Size(max = 1000) String generalObjective,
        List<@Size(max = 1000) String> specificObjectives
) {
}
