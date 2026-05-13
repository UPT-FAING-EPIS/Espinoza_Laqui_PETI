package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.PlanPhaseWorkflowService;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePhaseChangeRequestCommand;
import com.strategicti.application.usecase.PhaseChangeRequestSummary;
import com.strategicti.application.usecase.PhaseVersionSummary;
import com.strategicti.application.usecase.ReviewPhaseChangeRequestCommand;
import com.strategicti.domain.model.PetiPhase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/plan/phases/{phase}")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GroupPlanPhaseWorkflowController {
    private final PlanPhaseWorkflowService service;

    public GroupPlanPhaseWorkflowController(PlanPhaseWorkflowService service) {
        this.service = service;
    }

    @GetMapping("/changes")
    public List<PhaseChangeRequestSummary> changes(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.listChangeRequests(groupId, phase, user);
    }

    @PostMapping("/changes")
    @ResponseStatus(HttpStatus.CREATED)
    public PhaseChangeRequestSummary createChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @Valid @RequestBody CreatePhaseChangeRequestCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.createChangeRequest(groupId, phase, command, user);
    }

    @PutMapping("/changes/{requestId}")
    public PhaseChangeRequestSummary updateChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @PathVariable Long requestId,
            @Valid @RequestBody CreatePhaseChangeRequestCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateChangeRequest(groupId, phase, requestId, command, user);
    }

    @PostMapping("/changes/{requestId}/submit")
    public PhaseChangeRequestSummary submitChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.submitChangeRequest(groupId, phase, requestId, user);
    }

    @PostMapping("/changes/{requestId}/approve")
    public PhaseChangeRequestSummary approveChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) ReviewPhaseChangeRequestCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.approveChangeRequest(groupId, phase, requestId, review(command), user);
    }

    @PostMapping("/changes/{requestId}/reject")
    public PhaseChangeRequestSummary rejectChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) ReviewPhaseChangeRequestCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.rejectChangeRequest(groupId, phase, requestId, review(command), user);
    }

    @DeleteMapping("/changes/{requestId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void discardChange(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            @PathVariable Long requestId,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        service.discardChangeRequest(groupId, phase, requestId, user);
    }

    @GetMapping("/versions")
    public List<PhaseVersionSummary> versions(
            @PathVariable Long groupId,
            @PathVariable PetiPhase phase,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.listVersions(groupId, phase, user);
    }

    private ReviewPhaseChangeRequestCommand review(ReviewPhaseChangeRequestCommand command) {
        return command == null ? new ReviewPhaseChangeRequestCommand("") : command;
    }
}
