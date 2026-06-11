package com.strategicti.domain.model;

import java.time.Instant;

public record CameAction(
        Long id,
        Long planId,
        CameQuadrant quadrant,
        String description,
        String relatedFactor,
        DiagnosticPriority priority,
        int position,
        Instant updatedAt
) {
    public CameAction {
        if (planId == null) throw new IllegalArgumentException("El plan es obligatorio.");
        if (quadrant == null) throw new IllegalArgumentException("El cuadrante CAME es obligatorio.");
        if (description == null || description.isBlank()) throw new IllegalArgumentException("La descripcion es obligatoria.");
        relatedFactor = relatedFactor == null ? "" : relatedFactor;
        priority = priority == null ? DiagnosticPriority.MEDIA : priority;
        updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public static CameAction create(Long planId, CameQuadrant quadrant, String description,
                                    String relatedFactor, DiagnosticPriority priority, int position) {
        return new CameAction(null, planId, quadrant, description, relatedFactor, priority, position, Instant.now());
    }
}
