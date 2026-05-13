package com.strategicti.application.usecase;

import jakarta.validation.constraints.Size;

public record ReviewPhaseChangeRequestCommand(
        @Size(max = 1000) String comment
) {
}
