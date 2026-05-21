package com.strategicti.application.usecase;

import jakarta.validation.Valid;

import java.util.List;

public record UpdateSwotCommand(
        List<@Valid SwotItemCommand> strengths,
        List<@Valid SwotItemCommand> opportunities,
        List<@Valid SwotItemCommand> weaknesses,
        List<@Valid SwotItemCommand> threats
) {
}
