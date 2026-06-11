package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.UserAccountService;
import com.strategicti.application.usecase.CreateUserCommand;
import com.strategicti.application.usecase.UpdateCredentialsCommand;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.application.usecase.UpdateUserCommand;
import com.strategicti.application.usecase.UserSummary;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class UserAccountController {
    private final UserAccountService service;

    public UserAccountController(UserAccountService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummary create(@Valid @RequestBody CreateUserCommand command) {
        return service.createUser(command);
    }

    @GetMapping
    public List<UserSummary> list() {
        return service.listUsers();
    }

    @GetMapping("/{id}")
    public UserSummary get(@PathVariable Long id) {
        return service.getUser(id);
    }

    @PutMapping("/{id}")
    public UserSummary update(@PathVariable Long id, @Valid @RequestBody UpdateUserCommand command) {
        return service.updateUser(id, command);
    }

    @PatchMapping("/{id}/credentials")
    public UserSummary updateCredentials(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCredentialsCommand command
    ) {
        return service.updateCredentials(id, command);
    }

    @PatchMapping("/{id}/default-view")
    public UserSummary updateDefaultView(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDefaultViewCommand command
    ) {
        return service.updateDefaultView(id, command);
    }

    @PatchMapping("/{id}/disable")
    public UserSummary disable(@PathVariable Long id) {
        return service.disableUser(id);
    }

    @PatchMapping("/{id}/enable")
    public UserSummary enable(@PathVariable Long id) {
        return service.enableUser(id);
    }
}
