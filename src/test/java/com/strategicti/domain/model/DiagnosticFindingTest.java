package com.strategicti.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DiagnosticFindingTest {
    @Test
    void externalFindingAcceptsOpportunity() {
        DiagnosticFinding finding = DiagnosticFinding.create(
                1L,
                DiagnosticTool.PORTER,
                PorterForce.SUPPLIER_POWER.name(),
                SwotCategory.OPORTUNIDAD,
                "Proveedores especializados disponibles",
                "Analisis de proveedores",
                "Mejora de capacidad operativa",
                null,
                true,
                9L,
                0
        );

        assertEquals(DiagnosticPriority.MEDIA, finding.priority());
        assertEquals(SwotCategory.OPORTUNIDAD, finding.category());
    }

    @Test
    void externalFindingRejectsStrength() {
        assertThrows(IllegalArgumentException.class, () -> DiagnosticFinding.create(
                1L,
                DiagnosticTool.PEST,
                PestFactor.POLITICAL.name(),
                SwotCategory.FORTALEZA,
                "Equipo interno especializado",
                "",
                "",
                DiagnosticPriority.ALTA,
                false,
                9L,
                0
        ));
    }

    @Test
    void fodaCannotBeUsedAsFindingSource() {
        assertThrows(IllegalArgumentException.class, () -> DiagnosticFinding.create(
                1L,
                DiagnosticTool.FODA,
                "",
                SwotCategory.OPORTUNIDAD,
                "Mercado en crecimiento",
                "",
                "",
                DiagnosticPriority.MEDIA,
                false,
                9L,
                0
        ));
    }
}
