package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.DefaultView;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.UserStatus;
import com.strategicti.infrastructure.persistence.entity.UserAccountJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class UserAccountPersistenceFactory {
    public UserAccountJpaEntity toEntity(UserAccount user, UserAccountJpaEntity entity) {
        entity.setFirstName(user.firstName());
        entity.setLastName(user.lastName());
        entity.setEmail(user.email());
        entity.setPasswordHash(user.passwordHash());
        entity.setRole(user.role());
        entity.setStatus(user.status());
        entity.setDefaultView(user.defaultView());
        entity.setCreatedAt(user.createdAt());
        entity.setUpdatedAt(user.updatedAt());
        return entity;
    }

    public UserAccount toDomain(UserAccountJpaEntity entity) {
        return new UserAccount(
                entity.getId(),
                emptyIfNull(entity.getFirstName()),
                emptyIfNull(entity.getLastName()),
                emptyIfNull(entity.getEmail()),
                emptyIfNull(entity.getPasswordHash()),
                entity.getRole() == null ? SystemRole.USUARIO : entity.getRole(),
                entity.getStatus() == null ? UserStatus.ACTIVO : entity.getStatus(),
                defaultView(entity),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private DefaultView defaultView(UserAccountJpaEntity entity) {
        SystemRole role = entity.getRole() == null ? SystemRole.USUARIO : entity.getRole();
        DefaultView defaultView = entity.getDefaultView();
        if (defaultView == null || !defaultView.isAvailableTo(role)) {
            return DefaultView.forRole(role);
        }
        return defaultView;
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
