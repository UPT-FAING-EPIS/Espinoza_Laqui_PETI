package com.strategicti.application.service;

import com.strategicti.application.ports.out.IAuthTokenPort;
import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.application.usecase.AuthSession;
import com.strategicti.application.usecase.AuthenticationFailedException;
import com.strategicti.application.usecase.BootstrapAdminCommand;
import com.strategicti.application.usecase.LoginCommand;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.application.usecase.UserSummary;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.UserStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthenticationService {
    private final IUserAccountRepositoryPort repository;
    private final PasswordEncoder passwordEncoder;
    private final IAuthTokenPort tokenPort;

    public AuthenticationService(
            IUserAccountRepositoryPort repository,
            PasswordEncoder passwordEncoder,
            IAuthTokenPort tokenPort
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.tokenPort = tokenPort;
    }

    @Transactional
    public AuthSession bootstrapAdmin(BootstrapAdminCommand command) {
        if (repository.count() > 0) {
            throw new IllegalStateException("El administrador inicial ya fue configurado.");
        }

        UserAccount admin = UserAccount.create(
                clean(command.firstName()),
                clean(command.lastName()),
                normalizeEmail(command.email()),
                passwordEncoder.encode(command.password()),
                SystemRole.ADMINISTRADOR
        );
        return createSession(repository.save(admin));
    }

    @Transactional(readOnly = true)
    public AuthSession login(LoginCommand command) {
        UserAccount user = repository.findByEmail(normalizeEmail(command.email()))
                .orElseThrow(() -> new AuthenticationFailedException("Credenciales invalidas."));

        if (user.status() != UserStatus.ACTIVO) {
            throw new AuthenticationFailedException("El usuario se encuentra deshabilitado.");
        }
        if (!passwordEncoder.matches(command.password(), user.passwordHash())) {
            throw new AuthenticationFailedException("Credenciales invalidas.");
        }

        return createSession(user);
    }

    @Transactional(readOnly = true)
    public UserSummary currentUser(Long id) {
        UserAccount user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el usuario autenticado."));
        return toSummary(user);
    }

    @Transactional
    public UserSummary updateCurrentUserDefaultView(Long id, UpdateDefaultViewCommand command) {
        UserAccount user = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el usuario autenticado."));
        return toSummary(repository.save(user.changeDefaultView(command.defaultView())));
    }

    private AuthSession createSession(UserAccount user) {
        return new AuthSession(
                "Bearer",
                tokenPort.issue(user),
                tokenPort.expiresInSeconds(),
                toSummary(user)
        );
    }

    private UserSummary toSummary(UserAccount user) {
        return new UserSummary(
                user.id(),
                user.firstName(),
                user.lastName(),
                user.email(),
                user.role(),
                user.status(),
                user.defaultView(),
                user.createdAt(),
                user.updatedAt()
        );
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeEmail(String value) {
        return clean(value).toLowerCase(Locale.ROOT);
    }
}
