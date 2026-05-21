package com.strategicti.application.usecase;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateValueChainCommand(
        List<@Valid ValueChainActivityCommand> supportActivities,
        List<@Valid ValueChainActivityCommand> primaryActivities,
        List<@Valid ValueChainAssessmentCommand> assessments,
        @Size(max = 1000) String observations,
        List<@Size(max = 1000) String> strengths,
        List<@Size(max = 1000) String> weaknesses
) {
}
