package com.strategicti.application.usecase;

import java.time.Instant;
import java.util.List;

public record PlanningGroupSummary(
        Long id,
        String name,
        String description,
        List<GroupMemberSummary> members,
        Instant createdAt,
        Instant updatedAt
) {
}
