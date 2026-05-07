package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.StrategicPlanRepositoryPort;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.infrastructure.persistence.entity.StrategicPlanJpaEntity;
import com.strategicti.infrastructure.persistence.factory.StrategicPlanPersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataStrategicPlanRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class StrategicPlanPersistenceAdapter implements StrategicPlanRepositoryPort {
    private final SpringDataStrategicPlanRepository repository;
    private final StrategicPlanPersistenceFactory factory;

    public StrategicPlanPersistenceAdapter(
            SpringDataStrategicPlanRepository repository,
            StrategicPlanPersistenceFactory factory
    ) {
        this.repository = repository;
        this.factory = factory;
    }

    @Override
    public Optional<StrategicPlan> findCurrent() {
        return repository.findFirstByCurrentPlanTrueOrderByIdAsc().map(factory::toDomain);
    }

    @Override
    public StrategicPlan save(StrategicPlan plan) {
        StrategicPlanJpaEntity currentEntity = plan.id() == null
                ? new StrategicPlanJpaEntity()
                : repository.findById(plan.id()).orElseGet(StrategicPlanJpaEntity::new);

        StrategicPlanJpaEntity entity = factory.toEntity(plan, currentEntity);
        return factory.toDomain(repository.save(entity));
    }
}
