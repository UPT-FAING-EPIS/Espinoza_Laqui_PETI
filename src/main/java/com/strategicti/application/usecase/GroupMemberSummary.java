package com.strategicti.application.usecase;

import com.strategicti.domain.model.GroupRole;

import java.time.Instant;

public record GroupMemberSummary(
        Long userId,
        String firstName,
        String lastName,
        String email,
        GroupRole role,
        Instant joinedAt
) {
}
