package com.strategicti.application.usecase;

import com.strategicti.domain.model.SystemRole;

public record AuthenticatedUser(
        Long id,
        String email,
        SystemRole role
) {
}
