package com.strategicti.support;

import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.domain.model.StrategicPlan;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class InMemoryStrategicPlanRepository implements IStrategicPlanRepositoryPort {
    private final Map<Long, StrategicPlan> plans = new LinkedHashMap<>();
    private long sequence;

    @Override
    public Optional<StrategicPlan> findCurrent() {
        return plans.values().stream()
                .filter(plan -> plan.groupId() == null)
                .findFirst();
    }

    @Override
    public Optional<StrategicPlan> findCurrentByGroupId(Long groupId) {
        return plans.values().stream()
                .filter(plan -> groupId.equals(plan.groupId()))
                .findFirst();
    }

    @Override
    public StrategicPlan save(StrategicPlan plan) {
        Long id = plan.id() == null ? ++sequence : plan.id();
        StrategicPlan persisted = new StrategicPlan(
                id,
                plan.groupId(),
                plan.profile(),
                plan.objectives(),
                plan.activePhase(),
                plan.completedPhases(),
                plan.updatedAt()
        );
        plans.put(id, persisted);
        return persisted;
    }
}
