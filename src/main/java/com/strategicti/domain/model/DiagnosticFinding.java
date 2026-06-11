package com.strategicti.domain.model;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

public record DiagnosticFinding(
        Long id,
        Long planId,
        DiagnosticTool source,
        String sourceDimension,
        SwotCategory category,
        String description,
        String evidence,
        String impact,
        DiagnosticPriority priority,
        boolean selectedForFoda,
        Long createdByUserId,
        int position,
        Instant createdAt,
        Instant updatedAt
) {
    private static final Set<DiagnosticTool> EXTERNAL_SOURCES = EnumSet.of(DiagnosticTool.PEST, DiagnosticTool.PORTER);
    private static final Set<DiagnosticTool> INTERNAL_SOURCES = EnumSet.of(DiagnosticTool.VALUE_CHAIN, DiagnosticTool.BCG);

    public DiagnosticFinding {
        if (planId == null) {
            throw new IllegalArgumentException("El plan del hallazgo es obligatorio.");
        }
        if (source == null || (!EXTERNAL_SOURCES.contains(source) && !INTERNAL_SOURCES.contains(source))) {
            throw new IllegalArgumentException("El hallazgo debe provenir de PEST, Porter, cadena de valor o BCG.");
        }
        if (category == null) {
            throw new IllegalArgumentException("La categoria FODA del hallazgo es obligatoria.");
        }
        sourceDimension = sourceDimension == null ? "" : sourceDimension;
        if (source == DiagnosticTool.PEST) {
            try {
                PestFactor.valueOf(sourceDimension);
            } catch (RuntimeException exception) {
                throw new IllegalArgumentException("El hallazgo PEST debe indicar un factor de origen valido.");
            }
        }
        if (source == DiagnosticTool.PORTER) {
            try {
                PorterForce.valueOf(sourceDimension);
            } catch (RuntimeException exception) {
                throw new IllegalArgumentException("El hallazgo Porter debe indicar una fuerza de origen valida.");
            }
        }
        if (source == DiagnosticTool.VALUE_CHAIN) {
            try {
                ValueChainActivity.valueOf(sourceDimension);
            } catch (RuntimeException exception) {
                throw new IllegalArgumentException("El hallazgo de cadena de valor debe indicar una actividad de origen valida.");
            }
        }
        if (EXTERNAL_SOURCES.contains(source) && category != SwotCategory.OPORTUNIDAD && category != SwotCategory.AMENAZA) {
            throw new IllegalArgumentException("Un hallazgo externo solo puede ser una oportunidad o amenaza.");
        }
        if (INTERNAL_SOURCES.contains(source) && category != SwotCategory.FORTALEZA && category != SwotCategory.DEBILIDAD) {
            throw new IllegalArgumentException("Un hallazgo interno solo puede ser una fortaleza o debilidad.");
        }
        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("La descripcion del hallazgo es obligatoria.");
        }
        if (createdByUserId == null) {
            throw new IllegalArgumentException("El autor del hallazgo es obligatorio.");
        }
        if (position < 0) {
            throw new IllegalArgumentException("La posicion del hallazgo no puede ser negativa.");
        }
        evidence = evidence == null ? "" : evidence;
        impact = impact == null ? "" : impact;
        priority = priority == null ? DiagnosticPriority.MEDIA : priority;
        createdAt = createdAt == null ? Instant.now() : createdAt;
        updatedAt = updatedAt == null ? createdAt : updatedAt;
    }

    public static DiagnosticFinding create(
            Long planId,
            DiagnosticTool source,
            String sourceDimension,
            SwotCategory category,
            String description,
            String evidence,
            String impact,
            DiagnosticPriority priority,
            boolean selectedForFoda,
            Long createdByUserId,
            int position
    ) {
        Instant now = Instant.now();
        return new DiagnosticFinding(
                null,
                planId,
                source,
                sourceDimension,
                category,
                description,
                evidence,
                impact,
                priority,
                selectedForFoda,
                createdByUserId,
                position,
                now,
                now
        );
    }
}
