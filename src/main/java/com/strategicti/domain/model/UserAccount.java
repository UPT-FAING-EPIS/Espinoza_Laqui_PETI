package com.strategicti.domain.model;

import java.time.Instant;

public record UserAccount(
        Long id,
        String firstName,
        String lastName,
        String email,
        String passwordHash,
        SystemRole role,
        UserStatus status,
        DefaultView defaultView,
        Instant createdAt,
        Instant updatedAt
) {
    public UserAccount {
        role = role == null ? SystemRole.USUARIO : role;
        status = status == null ? UserStatus.ACTIVO : status;
        defaultView = defaultView == null || !defaultView.isAvailableTo(role) ? DefaultView.forRole(role) : defaultView;
    }

    public static UserAccount create(
            String firstName,
            String lastName,
            String email,
            String passwordHash,
            SystemRole role
    ) {
        Instant now = Instant.now();
        return new UserAccount(
                null,
                firstName,
                lastName,
                email,
                passwordHash,
                role == null ? SystemRole.USUARIO : role,
                UserStatus.ACTIVO,
                DefaultView.forRole(role),
                now,
                now
        );
    }

    public UserAccount updateProfile(String firstName, String lastName, String email, SystemRole role) {
        SystemRole nextRole = role == null ? this.role : role;
        DefaultView nextDefaultView = defaultView.isAvailableTo(nextRole) ? defaultView : DefaultView.forRole(nextRole);
        return new UserAccount(
                id,
                firstName,
                lastName,
                email,
                passwordHash,
                nextRole,
                status,
                nextDefaultView,
                createdAt,
                Instant.now()
        );
    }

    public UserAccount updateCredentials(String passwordHash) {
        return new UserAccount(
                id,
                firstName,
                lastName,
                email,
                passwordHash,
                role,
                status,
                defaultView,
                createdAt,
                Instant.now()
        );
    }

    public UserAccount changeDefaultView(DefaultView defaultView) {
        DefaultView nextDefaultView = defaultView == null ? DefaultView.forRole(role) : defaultView;
        if (!nextDefaultView.isAvailableTo(role)) {
            throw new IllegalArgumentException("La vista predeterminada no esta disponible para el rol del usuario.");
        }
        return new UserAccount(
                id,
                firstName,
                lastName,
                email,
                passwordHash,
                role,
                status,
                nextDefaultView,
                createdAt,
                Instant.now()
        );
    }

    public UserAccount disable() {
        return changeStatus(UserStatus.INACTIVO);
    }

    public UserAccount enable() {
        return changeStatus(UserStatus.ACTIVO);
    }

    private UserAccount changeStatus(UserStatus nextStatus) {
        return new UserAccount(
                id,
                firstName,
                lastName,
                email,
                passwordHash,
                role,
                nextStatus,
                defaultView,
                createdAt,
                Instant.now()
        );
    }
}
