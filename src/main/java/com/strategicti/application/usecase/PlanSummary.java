package com.strategicti.application.usecase;

import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseSnapshot;

import java.time.Instant;
import java.util.List;

public record PlanSummary(
        Long id,
        CompanyProfile profile,
        PetiPhase activePhase,
        int totalProgress,
        List<PhaseSnapshot> phases,
        Instant updatedAt
) {
}
