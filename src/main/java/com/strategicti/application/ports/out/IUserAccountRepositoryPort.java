package com.strategicti.application.ports.out;

import com.strategicti.domain.model.UserAccount;

import java.util.List;
import java.util.Optional;

public interface IUserAccountRepositoryPort {
    Optional<UserAccount> findById(Long id);

    Optional<UserAccount> findByEmail(String email);

    List<UserAccount> findAll();

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    long count();

    UserAccount save(UserAccount user);
}
