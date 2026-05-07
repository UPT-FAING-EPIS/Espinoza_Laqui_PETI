package com.strategicti.application.ports.out;

import com.strategicti.domain.model.StrategicPlan;

import java.util.Optional;

public interface StrategicPlanRepositoryPort {
    Optional<StrategicPlan> findCurrent();

    StrategicPlan save(StrategicPlan plan);
}
