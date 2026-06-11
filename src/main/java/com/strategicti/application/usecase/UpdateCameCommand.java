package com.strategicti.application.usecase;

import jakarta.validation.Valid;

import java.util.List;

public record UpdateCameCommand(
        List<@Valid CameActionCommand> corregir,
        List<@Valid CameActionCommand> afrontar,
        List<@Valid CameActionCommand> mantener,
        List<@Valid CameActionCommand> explotar
) {}
