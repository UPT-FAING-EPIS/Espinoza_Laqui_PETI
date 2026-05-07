package com.strategicti.domain.model;

import java.util.Optional;

public enum PetiPhase {
    IDENTITY("Identidad estratégica", "Empresa, misión, visión, valores, UEN y objetivos"),
    DIAGNOSTICS("Diagnósticos", "FODA, cadena de valor, BCG, Porter y PEST"),
    FORMULATION("Formulación", "Cruce FODA, estrategia competitiva y matriz CAME"),
    CONSOLIDATION("Consolidación", "Resumen ejecutivo y exportación del PETI");

    private final String title;
    private final String description;

    PetiPhase(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public Optional<PetiPhase> next() {
        int nextOrdinal = ordinal() + 1;
        PetiPhase[] phases = values();
        if (nextOrdinal >= phases.length) {
            return Optional.empty();
        }
        return Optional.of(phases[nextOrdinal]);
    }
}
