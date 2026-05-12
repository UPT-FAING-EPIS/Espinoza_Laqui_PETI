package com.strategicti.application.usecase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateIdentityCommand(
        @Size(max = 2000) String mission,
        @Size(max = 2000) String vision,
        @Size(max = 2000) String valuesText,
        List<@Valid StrategicObjectiveCommand> objectives
) {
}
