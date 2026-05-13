package com.strategicti.domain.model;

import java.time.Instant;

public record PlanPhaseVersion(
        Long id,
        Long planId,
        PetiPhase phase,
        int versionNumber,
        boolean official,
        Long sourceChangeRequestId,
        String contentJson,
        Long createdByUserId,
        Long approvedByUserId,
        Instant createdAt,
        Instant approvedAt
) {
    public static PlanPhaseVersion official(
            Long planId,
            PetiPhase phase,
            int versionNumber,
            Long sourceChangeRequestId,
            String contentJson,
            Long createdByUserId,
            Long approvedByUserId
    ) {
        Instant now = Instant.now();
        return new PlanPhaseVersion(
                null,
                planId,
                phase,
                versionNumber,
                true,
                sourceChangeRequestId,
                contentJson,
                createdByUserId,
                approvedByUserId,
                now,
                now
        );
    }
}
