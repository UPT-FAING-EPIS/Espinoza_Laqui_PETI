package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.infrastructure.persistence.entity.UserAccountJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataUserAccountRepository extends JpaRepository<UserAccountJpaEntity, Long> {
    Optional<UserAccountJpaEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}
