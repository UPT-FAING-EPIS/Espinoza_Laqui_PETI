package com.strategicti.support;

import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.domain.model.UserAccount;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class InMemoryUserAccountRepository implements IUserAccountRepositoryPort {
    private final Map<Long, UserAccount> users = new LinkedHashMap<>();
    private long sequence;

    @Override
    public Optional<UserAccount> findById(Long id) {
        return Optional.ofNullable(users.get(id));
    }

    @Override
    public Optional<UserAccount> findByEmail(String email) {
        return users.values().stream()
                .filter(user -> user.email().equals(email))
                .findFirst();
    }

    @Override
    public List<UserAccount> findAll() {
        return new ArrayList<>(users.values());
    }

    @Override
    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    @Override
    public boolean existsByEmailAndIdNot(String email, Long id) {
        return users.values().stream()
                .anyMatch(user -> user.email().equals(email) && !user.id().equals(id));
    }

    @Override
    public long count() {
        return users.size();
    }

    @Override
    public UserAccount save(UserAccount user) {
        Long id = user.id() == null ? ++sequence : user.id();
        UserAccount persisted = new UserAccount(
                id,
                user.firstName(),
                user.lastName(),
                user.email(),
                user.passwordHash(),
                user.role(),
                user.status(),
                user.defaultView(),
                user.createdAt(),
                user.updatedAt()
        );
        users.put(id, persisted);
        return persisted;
    }
}
