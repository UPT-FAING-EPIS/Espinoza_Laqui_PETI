package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.infrastructure.persistence.entity.UserAccountJpaEntity;
import com.strategicti.infrastructure.persistence.factory.UserAccountPersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataUserAccountRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class UserAccountPersistenceAdapter implements IUserAccountRepositoryPort {
    private final SpringDataUserAccountRepository repository;
    private final UserAccountPersistenceFactory factory;

    public UserAccountPersistenceAdapter(
            SpringDataUserAccountRepository repository,
            UserAccountPersistenceFactory factory
    ) {
        this.repository = repository;
        this.factory = factory;
    }

    @Override
    public Optional<UserAccount> findById(Long id) {
        return repository.findById(id).map(factory::toDomain);
    }

    @Override
    public Optional<UserAccount> findByEmail(String email) {
        return repository.findByEmail(email).map(factory::toDomain);
    }

    @Override
    public List<UserAccount> findAll() {
        return repository.findAll().stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public boolean existsByEmail(String email) {
        return repository.existsByEmail(email);
    }

    @Override
    public boolean existsByEmailAndIdNot(String email, Long id) {
        return repository.existsByEmailAndIdNot(email, id);
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public UserAccount save(UserAccount user) {
        UserAccountJpaEntity currentEntity = user.id() == null
                ? new UserAccountJpaEntity()
                : repository.findById(user.id()).orElseGet(UserAccountJpaEntity::new);

        UserAccountJpaEntity entity = factory.toEntity(user, currentEntity);
        return factory.toDomain(repository.save(entity));
    }
}
