package com.strategicti.application.service;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;

public interface PhaseContentApplier {
    PetiPhase phase();

    StrategicPlan apply(StrategicPlan plan, String contentJson);

    default boolean completesPhase(StrategicPlan plan, String contentJson) {
        return true;
    }
}
