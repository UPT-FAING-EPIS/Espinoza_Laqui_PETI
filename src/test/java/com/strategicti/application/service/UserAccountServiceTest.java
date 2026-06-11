package com.strategicti.application.service;

import com.strategicti.application.usecase.CreateUserCommand;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.application.usecase.UserSummary;
import com.strategicti.domain.model.DefaultView;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserStatus;
import com.strategicti.support.InMemoryUserAccountRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserAccountServiceTest {
    private final InMemoryUserAccountRepository repository = new InMemoryUserAccountRepository();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final UserAccountService service = new UserAccountService(repository, passwordEncoder);

    @Test
    void createUserDefaultsToNormalUserAndNormalizesEmail() {
        UserSummary user = service.createUser(new CreateUserCommand(
                "Luis",
                "Editor",
                "LUIS.EDITOR@strategicti.test",
                "Password123",
                null
        ));

        assertEquals(SystemRole.USUARIO, user.role());
        assertEquals(UserStatus.ACTIVO, user.status());
        assertEquals(DefaultView.MY_GROUPS, user.defaultView());
        assertEquals("luis.editor@strategicti.test", user.email());
        assertTrue(passwordEncoder.matches("Password123", repository.findById(user.id()).orElseThrow().passwordHash()));
    }

    @Test
    void createUserRejectsDuplicatedEmail() {
        service.createUser(new CreateUserCommand("Luis", "Editor", "luis@test.com", "Password123", null));

        assertThrows(IllegalStateException.class, () ->
                service.createUser(new CreateUserCommand("Luis", "Duplicado", "LUIS@test.com", "Password123", null))
        );
    }

    @Test
    void disableAndEnableUserChangesStatus() {
        UserSummary user = service.createUser(new CreateUserCommand("Luis", "Editor", "luis@test.com", "Password123", null));

        assertEquals(UserStatus.INACTIVO, service.disableUser(user.id()).status());
        assertEquals(UserStatus.ACTIVO, service.enableUser(user.id()).status());
    }

    @Test
    void updateDefaultViewChangesUserPreference() {
        UserSummary user = service.createUser(new CreateUserCommand("Luis", "Editor", "luis@test.com", "Password123", null));

        UserSummary updated = service.updateDefaultView(
                user.id(),
                new UpdateDefaultViewCommand(DefaultView.CURRENT_PLAN)
        );

        assertEquals(DefaultView.CURRENT_PLAN, updated.defaultView());
    }

    @Test
    void updateDefaultViewRejectsAdminOnlyViewForNormalUser() {
        UserSummary user = service.createUser(new CreateUserCommand("Luis", "Editor", "luis@test.com", "Password123", null));

        assertThrows(IllegalArgumentException.class, () ->
                service.updateDefaultView(user.id(), new UpdateDefaultViewCommand(DefaultView.USER_MANAGEMENT))
        );
    }
}
