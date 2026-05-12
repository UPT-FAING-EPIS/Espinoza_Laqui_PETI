package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.PlanningGroupService;
import com.strategicti.application.usecase.AssignGroupMemberCommand;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePlanningGroupCommand;
import com.strategicti.application.usecase.PlanningGroupSummary;
import com.strategicti.application.usecase.UpdateGroupMemberRoleCommand;
import com.strategicti.application.usecase.UpdatePlanningGroupCommand;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class PlanningGroupController {
    private final PlanningGroupService service;

    public PlanningGroupController(PlanningGroupService service) {
        this.service = service;
    }

    @GetMapping("/my")
    public List<PlanningGroupSummary> myGroups(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.listGroupsForUser(user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanningGroupSummary create(@Valid @RequestBody CreatePlanningGroupCommand command) {
        return service.createGroup(command);
    }

    @GetMapping
    public List<PlanningGroupSummary> list() {
        return service.listGroups();
    }

    @GetMapping("/{id}")
    public PlanningGroupSummary get(@PathVariable Long id, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getGroupForViewer(id, user);
    }

    @PutMapping("/{id}")
    public PlanningGroupSummary update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePlanningGroupCommand command
    ) {
        return service.updateGroup(id, command);
    }

    @PostMapping("/{id}/members")
    public PlanningGroupSummary assignMember(
            @PathVariable Long id,
            @Valid @RequestBody AssignGroupMemberCommand command
    ) {
        return service.assignMember(id, command);
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public PlanningGroupSummary updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateGroupMemberRoleCommand command
    ) {
        return service.updateMemberRole(id, userId, command);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public PlanningGroupSummary removeMember(@PathVariable Long id, @PathVariable Long userId) {
        return service.removeMember(id, userId);
    }
}
