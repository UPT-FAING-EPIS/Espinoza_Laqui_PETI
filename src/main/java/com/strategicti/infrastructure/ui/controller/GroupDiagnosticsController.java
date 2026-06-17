package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.DiagnosticService;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.PestSummary;
import com.strategicti.application.usecase.PorterSummary;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.ValueChainSummary;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/pest")
    public PestSummary pest(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getPestForGroup(groupId, user);
    }

    @GetMapping("/porter")
    public PorterSummary porter(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getPorterForGroup(groupId, user);
    }

    @GetMapping("/value-chain")
    public ValueChainSummary valueChain(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getValueChainForGroup(groupId, user);
    }

    @GetMapping("/bcg")
    public BcgSummary bcg(@PathVariable Long groupId, Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.getBcgForGroup(groupId, user);
    }
}
