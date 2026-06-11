package com.strategicti.application.usecase;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCredentialsCommand(
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
