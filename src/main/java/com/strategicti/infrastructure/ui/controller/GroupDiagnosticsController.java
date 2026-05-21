package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.DiagnosticService;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.application.usecase.ValueChainSummary;
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
@RequestMapping("/api/groups/{groupId}/plan/diagnostics")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GroupDiagnosticsController {
    private final DiagnosticService service;

    public GroupDiagnosticsController(DiagnosticService service) {
        this.service = service;
    }

    @GetMapping("/foda")
    public SwotSummary swot(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getSwotForGroup(groupId, user);
    }

    @PutMapping("/foda")
    public SwotSummary updateSwot(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateSwotCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateSwotForGroup(groupId, command, user);
    }

    @GetMapping("/value-chain")
    public ValueChainSummary valueChain(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getValueChainForGroup(groupId, user);
    }

    @PutMapping("/value-chain")
    public ValueChainSummary updateValueChain(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateValueChainCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateValueChainForGroup(groupId, command, user);
    }

    @GetMapping("/bcg")
    public BcgSummary bcg(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getBcgForGroup(groupId, user);
    }

    @PutMapping("/bcg")
    public BcgSummary updateBcg(
            @PathVariable Long groupId,
            @Valid @RequestBody UpdateBcgCommand command,
            Authentication authentication
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateBcgForGroup(groupId, command, user);
    }
}
