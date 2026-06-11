package com.strategicti.domain.model;

import java.time.Instant;

public record GroupMember(
        Long userId,
        String firstName,
        String lastName,
        String email,
        GroupRole role,
        Instant joinedAt
) {
    public static GroupMember from(UserAccount user, GroupRole role) {
        return new GroupMember(
                user.id(),
                user.firstName(),
                user.lastName(),
                user.email(),
                role == null ? GroupRole.EDITOR : role,
                Instant.now()
        );
    }

    public GroupMember changeRole(GroupRole nextRole) {
        return new GroupMember(
                userId,
                firstName,
                lastName,
                email,
                nextRole == null ? GroupRole.EDITOR : nextRole,
                joinedAt
        );
    }
}
