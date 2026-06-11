package com.strategicti.application.usecase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

import java.util.List;

public record CreatePhaseChangeRequestCommand(
        @NotBlank @Size(max = 160) String title,
        @Size(max = 1000) String description,
        @NotNull JsonNode proposedContent,
        List<@Valid PhaseChangeEntryCommand> entries
) {
}
