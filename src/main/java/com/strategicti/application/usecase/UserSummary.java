package com.strategicti.application.usecase;

import com.strategicti.domain.model.DefaultView;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserStatus;

import java.time.Instant;

public record UserSummary(
        Long id,
        String firstName,
        String lastName,
        String email,
        SystemRole role,
        UserStatus status,
        DefaultView defaultView,
        Instant createdAt,
        Instant updatedAt
) {
}
