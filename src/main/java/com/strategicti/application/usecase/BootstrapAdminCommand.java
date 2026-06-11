package com.strategicti.application.usecase;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BootstrapAdminCommand(
        @NotBlank @Size(max = 120) String firstName,
        @NotBlank @Size(max = 120) String lastName,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 8, max = 120) String password
) {
}
