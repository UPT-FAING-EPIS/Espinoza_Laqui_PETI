package com.strategicti.application.usecase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlanningGroupCommand(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 2000) String description
) {
}
