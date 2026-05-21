package com.strategicti.domain.model;

import java.time.Instant;

public record DiagnosticItem(
        Long id,
        Long planId,
        DiagnosticTool tool,
        String category,
        String description,
        DiagnosticPriority priority,
        int position,
        Instant updatedAt
) {
    public DiagnosticItem {
        priority = priority == null ? DiagnosticPriority.MEDIA : priority;
        updatedAt = updatedAt == null ? Instant.now() : updatedAt;
    }

    public static DiagnosticItem foda(
            Long planId,
            SwotCategory category,
            String description,
            DiagnosticPriority priority,
            int position
    ) {
        return diagnostic(planId, DiagnosticTool.FODA, category.name(), description, priority, position);
    }

    public static DiagnosticItem valueChain(
            Long planId,
            String category,
            String description,
            DiagnosticPriority priority,
            int position
    ) {
        return diagnostic(planId, DiagnosticTool.VALUE_CHAIN, category, description, priority, position);
    }

    public static DiagnosticItem bcg(
            Long planId,
            String category,
            String description,
            DiagnosticPriority priority,
            int position
    ) {
        return diagnostic(planId, DiagnosticTool.BCG, category, description, priority, position);
    }

    public static DiagnosticItem diagnostic(
            Long planId,
            DiagnosticTool tool,
            String category,
            String description,
            DiagnosticPriority priority,
            int position
    ) {
        return new DiagnosticItem(
                null,
                planId,
                tool,
                category,
                description,
                priority,
                position,
                Instant.now()
        );
    }
}
