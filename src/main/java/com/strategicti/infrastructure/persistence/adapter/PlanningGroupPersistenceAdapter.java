package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.infrastructure.persistence.entity.PlanningGroupJpaEntity;
import com.strategicti.infrastructure.persistence.factory.PlanningGroupPersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataPlanningGroupRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PlanningGroupPersistenceAdapter implements IPlanningGroupRepositoryPort {
    private final SpringDataPlanningGroupRepository repository;
    private final PlanningGroupPersistenceFactory factory;

    public PlanningGroupPersistenceAdapter(
            SpringDataPlanningGroupRepository repository,
            PlanningGroupPersistenceFactory factory
    ) {
        this.repository = repository;
        this.factory = factory;
    }

    @Override
    public Optional<PlanningGroup> findById(Long id) {
        return repository.findById(id).map(factory::toDomain);
    }

    @Override
    public List<PlanningGroup> findAll() {
        return repository.findAll().stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public List<PlanningGroup> findByMemberUserId(Long userId) {
        return repository.findDistinctByMembersUserId(userId).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return repository.existsByName(name);
    }

    @Override
    public boolean existsByNameAndIdNot(String name, Long id) {
        return repository.existsByNameAndIdNot(name, id);
    }

    @Override
    public PlanningGroup save(PlanningGroup group) {
        PlanningGroupJpaEntity currentEntity = group.id() == null
                ? new PlanningGroupJpaEntity()
                : repository.findById(group.id()).orElseGet(PlanningGroupJpaEntity::new);
        return factory.toDomain(repository.save(factory.toEntity(group, currentEntity)));
    }
}
