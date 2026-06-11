package com.strategicti.domain.model;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public record StrategicPlan(
        Long id,
        Long groupId,
        CompanyProfile profile,
        List<StrategicObjective> objectives,
        PetiPhase activePhase,
        Set<PetiPhase> completedPhases,
        Instant updatedAt
) {
    public StrategicPlan {
        objectives = objectives == null ? List.of() : List.copyOf(objectives);
        completedPhases = completedPhases == null ? EnumSet.noneOf(PetiPhase.class) : Set.copyOf(completedPhases);
    }

    public static StrategicPlan newPlan() {
        return newPlan(null);
    }

    public static StrategicPlan newPlanForGroup(Long groupId) {
        return newPlan(groupId);
    }

    private static StrategicPlan newPlan(Long groupId) {
        return new StrategicPlan(
                null,
                groupId,
                CompanyProfile.empty(),
                List.of(),
                PetiPhase.IDENTITY,
                EnumSet.noneOf(PetiPhase.class),
                Instant.now()
        );
    }

    public StrategicPlan updateProfile(CompanyProfile nextProfile) {
        return new StrategicPlan(id, groupId, nextProfile, objectives, activePhase, completedPhases, Instant.now());
    }

    public StrategicPlan updateIdentity(
            String mission,
            String vision,
            String valuesText,
            List<StrategicObjective> nextObjectives
    ) {
        return new StrategicPlan(
                id,
                groupId,
                profile.withIdentity(mission, vision, valuesText),
                List.copyOf(nextObjectives),
                activePhase,
                completedPhases,
                Instant.now()
        );
    }

    public StrategicPlan complete(PetiPhase phase) {
        EnumSet<PetiPhase> nextCompleted = completedCopy();
        nextCompleted.add(phase);
        PetiPhase nextActive = activePhase == phase ? phase.next().orElse(phase) : activePhase;
        return new StrategicPlan(id, groupId, profile, objectives, nextActive, nextCompleted, Instant.now());
    }

    public boolean isCompleted(PetiPhase phase) {
        return completedPhases.contains(phase);
    }

    public boolean isIdentityReady() {
        return profile.isIdentityReady() && objectives.stream().anyMatch(StrategicObjective::isComplete);
    }

    private EnumSet<PetiPhase> completedCopy() {
        if (completedPhases.isEmpty()) {
            return EnumSet.noneOf(PetiPhase.class);
        }
        return EnumSet.copyOf(completedPhases);
    }
}
