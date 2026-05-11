package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.AuthenticationService;
import com.strategicti.application.usecase.AuthSession;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.BootstrapAdminCommand;
import com.strategicti.application.usecase.LoginCommand;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.application.usecase.UserSummary;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AuthenticationController {
    private final AuthenticationService service;

    public AuthenticationController(AuthenticationService service) {
        this.service = service;
    }

    @PostMapping("/bootstrap-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthSession bootstrapAdmin(@Valid @RequestBody BootstrapAdminCommand command) {
        return service.bootstrapAdmin(command);
    }

    @PostMapping("/login")
    public AuthSession login(@Valid @RequestBody LoginCommand command) {
        return service.login(command);
    }

    @GetMapping("/me")
    public UserSummary me(Authentication authentication) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.currentUser(user.id());
    }

    @PatchMapping("/me/default-view")
    public UserSummary updateMyDefaultView(
            Authentication authentication,
            @Valid @RequestBody UpdateDefaultViewCommand command
    ) {
        AuthenticatedUser user = (AuthenticatedUser) authentication.getPrincipal();
        return service.updateCurrentUserDefaultView(user.id(), command);
    }
}
