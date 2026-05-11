package com.strategicti.application.usecase;

import com.strategicti.domain.model.DefaultView;
import jakarta.validation.constraints.NotNull;

public record UpdateDefaultViewCommand(
        @NotNull DefaultView defaultView
) {
}
