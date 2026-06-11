package com.strategicti.application.usecase;

import com.strategicti.domain.model.GroupRole;
import jakarta.validation.constraints.NotNull;

public record UpdateGroupMemberRoleCommand(
        @NotNull GroupRole role
) {
}
