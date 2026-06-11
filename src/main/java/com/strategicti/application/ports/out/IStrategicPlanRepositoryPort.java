package com.strategicti.application.ports.out;

import com.strategicti.domain.model.StrategicPlan;

import java.util.Optional;

public interface IStrategicPlanRepositoryPort {
    Optional<StrategicPlan> findCurrent();

    Optional<StrategicPlan> findCurrentByGroupId(Long groupId);

    StrategicPlan save(StrategicPlan plan);
}
