package com.strategicti.infrastructure.security;

import com.strategicti.domain.model.DefaultView;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.UserStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenServiceTest {
    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-05-11T15:00:00Z"), ZoneOffset.UTC);

    @Test
    void issueAndValidateToken() {
        JwtTokenService service = new JwtTokenService("test-secret-for-jwt-validation-123456789", 60, FIXED_CLOCK);
        UserAccount user = UserAccount.create(
                "Ana",
                "Admin",
                "ana@test.com",
                "hash",
                SystemRole.ADMINISTRADOR
        );
        user = new UserAccount(7L, user.firstName(), user.lastName(), user.email(), user.passwordHash(), user.role(), user.status(), user.defaultView(), user.createdAt(), user.updatedAt());

        var principal = service.validate(service.issue(user)).orElseThrow();

        assertEquals(7L, principal.id());
        assertEquals("ana@test.com", principal.email());
        assertEquals(SystemRole.ADMINISTRADOR, principal.role());
    }

    @Test
    void rejectTamperedToken() {
        JwtTokenService service = new JwtTokenService("test-secret-for-jwt-validation-123456789", 60, FIXED_CLOCK);
        UserAccount user = new UserAccount(
                9L,
                "Ana",
                "Admin",
                "ana@test.com",
                "hash",
                SystemRole.ADMINISTRADOR,
                UserStatus.ACTIVO,
                DefaultView.USER_MANAGEMENT,
                Instant.now(FIXED_CLOCK),
                Instant.now(FIXED_CLOCK)
        );

        String token = service.issue(user) + "tampered";

        assertTrue(service.validate(token).isEmpty());
    }

    @Test
    void rejectExpiredToken() {
        JwtTokenService service = new JwtTokenService("test-secret-for-jwt-validation-123456789", 0, FIXED_CLOCK);
        UserAccount user = new UserAccount(
                9L,
                "Ana",
                "Admin",
                "ana@test.com",
                "hash",
                SystemRole.ADMINISTRADOR,
                UserStatus.ACTIVO,
                DefaultView.USER_MANAGEMENT,
                Instant.now(FIXED_CLOCK),
                Instant.now(FIXED_CLOCK)
        );

        assertTrue(service.validate(service.issue(user)).isEmpty());
    }
}
