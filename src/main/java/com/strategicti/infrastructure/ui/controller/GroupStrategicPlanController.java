package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.StrategicPlanService;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.IdentitySectionSummary;
import com.strategicti.application.usecase.PlanSummary;
import com.strategicti.application.usecase.UpdateIdentityCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/plan")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GroupStrategicPlanController {
    private final StrategicPlanService service;

    public GroupStrategicPlanController(StrategicPlanService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanSummary create(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.createPlanForGroup(groupId, user);
    }

    @GetMapping
    public PlanSummary get(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getPlanForGroup(groupId, user);
    }

    @GetMapping("/identity")
    public IdentitySectionSummary identity(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getIdentityForGroup(groupId, user);
    }

    @PutMapping("/identity")
    public IdentitySectionSummary updateIdentity(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateIdentityCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateIdentityForGroup(groupId, command, user);
    }
}
