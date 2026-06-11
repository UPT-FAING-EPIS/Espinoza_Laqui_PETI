package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.CameService;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CameSummary;
import com.strategicti.application.usecase.UpdateCameCommand;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups/{groupId}/plan/formulation/came")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GroupCameController {

    private final CameService service;

    public GroupCameController(CameService service) {
        this.service = service;
    }

    @GetMapping
    public CameSummary get(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getCameForGroup(groupId, user);
    }

    @PutMapping
    public CameSummary update(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateCameCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateCameForGroup(groupId, command, user);
    }
}
