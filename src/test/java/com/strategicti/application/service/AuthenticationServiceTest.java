package com.strategicti.application.service;

import com.strategicti.application.ports.out.IAuthTokenPort;
import com.strategicti.application.usecase.AuthSession;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.AuthenticationFailedException;
import com.strategicti.application.usecase.BootstrapAdminCommand;
import com.strategicti.application.usecase.LoginCommand;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.domain.model.DefaultView;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.support.InMemoryUserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthenticationServiceTest {
    private final InMemoryUserAccountRepository repository = new InMemoryUserAccountRepository();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final AuthenticationService service = new AuthenticationService(
            repository,
            passwordEncoder,
            new FixedTokenPort()
    );

    @Test
    void bootstrapAdminCreatesFirstAdministrator() {
        AuthSession session = service.bootstrapAdmin(new BootstrapAdminCommand(
                "Ana",
                "Admin",
                "ANA.ADMIN@strategicti.test",
                "Password123"
        ));

        UserAccount saved = repository.findByEmail("ana.admin@strategicti.test").orElseThrow();
        assertEquals(SystemRole.ADMINISTRADOR, session.user().role());
        assertEquals(DefaultView.USER_MANAGEMENT, session.user().defaultView());
        assertEquals("token-1", session.accessToken());
        assertNotEquals("Password123", saved.passwordHash());
        assertTrue(passwordEncoder.matches("Password123", saved.passwordHash()));
    }

    @Test
    void bootstrapAdminFailsWhenUsersAlreadyExist() {
        service.bootstrapAdmin(new BootstrapAdminCommand("Ana", "Admin", "ana@test.com", "Password123"));

        assertThrows(IllegalStateException.class, () ->
                service.bootstrapAdmin(new BootstrapAdminCommand("Otro", "Admin", "otro@test.com", "Password123"))
        );
    }

    @Test
    void loginRejectsInvalidPassword() {
        service.bootstrapAdmin(new BootstrapAdminCommand("Ana", "Admin", "ana@test.com", "Password123"));

        assertThrows(AuthenticationFailedException.class, () ->
                service.login(new LoginCommand("ana@test.com", "bad-password"))
        );
    }

    @Test
    void loginRejectsDisabledUser() {
        AuthSession session = service.bootstrapAdmin(new BootstrapAdminCommand("Ana", "Admin", "ana@test.com", "Password123"));
        repository.save(repository.findById(session.user().id()).orElseThrow().disable());

        assertThrows(AuthenticationFailedException.class, () ->
                service.login(new LoginCommand("ana@test.com", "Password123"))
        );
    }

    @Test
    void updateCurrentUserDefaultViewChangesSessionUserPreference() {
        AuthSession session = service.bootstrapAdmin(new BootstrapAdminCommand("Ana", "Admin", "ana@test.com", "Password123"));

        var updated = service.updateCurrentUserDefaultView(
                session.user().id(),
                new UpdateDefaultViewCommand(DefaultView.GROUP_MANAGEMENT)
        );

        assertEquals(DefaultView.GROUP_MANAGEMENT, updated.defaultView());
    }

    private static class FixedTokenPort implements IAuthTokenPort {
        @Override
        public String issue(UserAccount user) {
            return "token-" + user.id();
        }

        @Override
        public Optional<AuthenticatedUser> validate(String token) {
            return Optional.empty();
        }

        @Override
        public long expiresInSeconds() {
            return 3600;
        }
    }
}
