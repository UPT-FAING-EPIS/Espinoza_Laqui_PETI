package com.strategicti.application.usecase;

import com.strategicti.domain.model.DiagnosticTool;

import java.util.List;

public record UpdateDiagnosticFindingsCommand(
        DiagnosticTool source,
        List<DiagnosticFindingCommand> findings
) {
}
