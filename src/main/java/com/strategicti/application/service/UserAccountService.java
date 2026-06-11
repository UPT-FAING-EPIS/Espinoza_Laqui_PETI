package com.strategicti.application.service;

import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.application.usecase.CreateUserCommand;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.UpdateCredentialsCommand;
import com.strategicti.application.usecase.UpdateDefaultViewCommand;
import com.strategicti.application.usecase.UpdateUserCommand;
import com.strategicti.application.usecase.UserSummary;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class UserAccountService {
    private final IUserAccountRepositoryPort repository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(IUserAccountRepositoryPort repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserSummary createUser(CreateUserCommand command) {
        String email = normalizeEmail(command.email());
        assertEmailAvailable(email);

        UserAccount user = UserAccount.create(
                clean(command.firstName()),
                clean(command.lastName()),
                email,
                passwordEncoder.encode(command.password()),
                defaultRole(command.role())
        );
        return toSummary(repository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserSummary> listUsers() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(UserAccount::id))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserSummary getUser(Long id) {
        return toSummary(findUser(id));
    }

    @Transactional
    public UserSummary updateUser(Long id, UpdateUserCommand command) {
        UserAccount current = findUser(id);
        String email = normalizeEmail(command.email());
        if (repository.existsByEmailAndIdNot(email, id)) {
            throw new IllegalStateException("Ya existe otro usuario con ese correo.");
        }

        UserAccount updated = current.updateProfile(
                clean(command.firstName()),
                clean(command.lastName()),
                email,
                command.role()
        );
        return toSummary(repository.save(updated));
    }

    @Transactional
    public UserSummary updateCredentials(Long id, UpdateCredentialsCommand command) {
        UserAccount current = findUser(id);
        return toSummary(repository.save(current.updateCredentials(passwordEncoder.encode(command.password()))));
    }

    @Transactional
    public UserSummary updateDefaultView(Long id, UpdateDefaultViewCommand command) {
        UserAccount current = findUser(id);
        return toSummary(repository.save(current.changeDefaultView(command.defaultView())));
    }

    @Transactional
    public UserSummary disableUser(Long id) {
        return toSummary(repository.save(findUser(id).disable()));
    }

    @Transactional
    public UserSummary enableUser(Long id) {
        return toSummary(repository.save(findUser(id).enable()));
    }

    private UserAccount findUser(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el usuario solicitado."));
    }

    private void assertEmailAvailable(String email) {
        if (repository.existsByEmail(email)) {
            throw new IllegalStateException("Ya existe un usuario con ese correo.");
        }
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

    private SystemRole defaultRole(SystemRole role) {
        return role == null ? SystemRole.USUARIO : role;
    }
}
