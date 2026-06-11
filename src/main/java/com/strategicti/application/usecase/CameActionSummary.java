package com.strategicti.application.usecase;

import com.strategicti.domain.model.CameQuadrant;
import com.strategicti.domain.model.DiagnosticPriority;

public record CameActionSummary(
        Long id,
        CameQuadrant quadrant,
        String description,
        String relatedFactor,
        DiagnosticPriority priority,
        int position
) {}
