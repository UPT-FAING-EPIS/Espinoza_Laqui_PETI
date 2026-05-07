package com.strategicti.domain.service;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseSnapshot;
import com.strategicti.domain.model.StrategicPlan;

import java.util.ArrayList;
import java.util.List;

public class PetiProgressPolicy {
    public void assertPhaseCanBeCompleted(StrategicPlan plan, PetiPhase phase) {
        if (isLocked(plan, phase)) {
            throw new IllegalStateException("La fase solicitada todavia esta bloqueada.");
        }

        if (phase == PetiPhase.IDENTITY && !plan.profile().isIdentityReady()) {
            throw new IllegalStateException("Complete la informacion de empresa, mision, vision y valores antes de cerrar la fase de identidad.");
        }
    }

    public List<PhaseSnapshot> snapshotsFor(StrategicPlan plan) {
        List<PhaseSnapshot> snapshots = new ArrayList<>();
        for (PetiPhase phase : PetiPhase.values()) {
            boolean completed = plan.isCompleted(phase);
            boolean locked = isLocked(plan, phase);
            int progress = completed ? 100 : (locked ? 0 : 50);
            snapshots.add(new PhaseSnapshot(
                    phase,
                    phase.title(),
                    phase.description(),
                    completed,
                    locked,
                    progress
            ));
        }
        return snapshots;
    }

    private boolean isLocked(StrategicPlan plan, PetiPhase phase) {
        if (phase == PetiPhase.IDENTITY) {
            return false;
        }

        PetiPhase previous = PetiPhase.values()[phase.ordinal() - 1];
        return !plan.isCompleted(previous);
    }
}
