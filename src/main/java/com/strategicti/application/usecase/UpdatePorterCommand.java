package com.strategicti.application.usecase;

import jakarta.validation.Valid;

import java.util.List;

public record UpdatePorterCommand(
        List<@Valid PorterResponseCommand> responses,
        List<@Valid DiagnosticFindingCommand> findings
) {
}
