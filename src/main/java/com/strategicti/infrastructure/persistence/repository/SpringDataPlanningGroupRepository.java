package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.infrastructure.persistence.entity.PlanningGroupJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataPlanningGroupRepository extends JpaRepository<PlanningGroupJpaEntity, Long> {
    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    List<PlanningGroupJpaEntity> findDistinctByMembersUserId(Long userId);
}
