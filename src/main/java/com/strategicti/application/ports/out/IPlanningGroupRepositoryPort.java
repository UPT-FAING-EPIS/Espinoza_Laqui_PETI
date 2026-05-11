package com.strategicti.application.ports.out;

import com.strategicti.domain.model.PlanningGroup;

import java.util.List;
import java.util.Optional;

public interface IPlanningGroupRepositoryPort {
    Optional<PlanningGroup> findById(Long id);

    List<PlanningGroup> findAll();

    List<PlanningGroup> findByMemberUserId(Long userId);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    PlanningGroup save(PlanningGroup group);
}
