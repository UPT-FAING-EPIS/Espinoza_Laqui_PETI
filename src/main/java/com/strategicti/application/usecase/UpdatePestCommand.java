package com.strategicti.application.usecase;

import jakarta.validation.Valid;

import java.util.List;

public record UpdatePestCommand(
        List<@Valid PestResponseCommand> responses,
        List<@Valid DiagnosticFindingCommand> findings
) {
}
