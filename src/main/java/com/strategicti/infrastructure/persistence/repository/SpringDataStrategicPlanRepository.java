package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.infrastructure.persistence.entity.StrategicPlanJpaEntity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpringDataStrategicPlanRepository extends JpaRepository<StrategicPlanJpaEntity, Long> {
    Optional<StrategicPlanJpaEntity> findFirstByCurrentPlanTrueOrderByIdAsc();
}
