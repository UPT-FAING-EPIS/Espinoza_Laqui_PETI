package com.strategicti.domain.model;

public record PhaseSnapshot(
        PetiPhase phase,
        String title,
        String description,
        boolean completed,
        boolean locked,
        int progress
) {
}
