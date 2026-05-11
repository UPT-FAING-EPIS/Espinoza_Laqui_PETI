package com.strategicti.application.usecase;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginCommand(
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(max = 120) String password
) {
}
