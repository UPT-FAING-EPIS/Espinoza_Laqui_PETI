package com.strategicti.domain.model;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

public record StrategicPlan(
        Long id,
        CompanyProfile profile,
        PetiPhase activePhase,
        Set<PetiPhase> completedPhases,
        Instant updatedAt
) {
    public static StrategicPlan newPlan() {
        return new StrategicPlan(
                null,
                CompanyProfile.empty(),
                PetiPhase.IDENTITY,
                EnumSet.noneOf(PetiPhase.class),
                Instant.now()
        );
    }

    public StrategicPlan updateProfile(CompanyProfile nextProfile) {
        return new StrategicPlan(id, nextProfile, activePhase, completedPhases, Instant.now());
    }

    public StrategicPlan complete(PetiPhase phase) {
        EnumSet<PetiPhase> nextCompleted = completedCopy();
        nextCompleted.add(phase);
        PetiPhase nextActive = phase.next().orElse(phase);
        return new StrategicPlan(id, profile, nextActive, nextCompleted, Instant.now());
    }

    public boolean isCompleted(PetiPhase phase) {
        return completedPhases.contains(phase);
    }

    private EnumSet<PetiPhase> completedCopy() {
        if (completedPhases.isEmpty()) {
            return EnumSet.noneOf(PetiPhase.class);
        }
        return EnumSet.copyOf(completedPhases);
    }
}
