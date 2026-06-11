package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.ICameRepositoryPort;
import com.strategicti.domain.model.CameAction;
import com.strategicti.domain.model.CameQuadrant;
import com.strategicti.infrastructure.persistence.factory.CamePersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataCameActionRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class CamePersistenceAdapter implements ICameRepositoryPort {

    private final SpringDataCameActionRepository repository;
    private final CamePersistenceFactory factory;

    public CamePersistenceAdapter(SpringDataCameActionRepository repository, CamePersistenceFactory factory) {
        this.repository = repository;
        this.factory = factory;
    }

    @Override
    public List<CameAction> findByPlanId(Long planId) {
        return repository.findByPlanIdOrderByQuadrantAscPositionAsc(planId)
                .stream().map(factory::toDomain).toList();
    }

    @Override
    public List<CameAction> findByPlanIdAndQuadrant(Long planId, CameQuadrant quadrant) {
        return repository.findByPlanIdAndQuadrantOrderByPositionAsc(planId, quadrant)
                .stream().map(factory::toDomain).toList();
    }

    @Override
    @Transactional
    public List<CameAction> replaceByPlanIdAndQuadrant(Long planId, CameQuadrant quadrant, List<CameAction> actions) {
        repository.deleteByPlanIdAndQuadrant(planId, quadrant);
        return repository.saveAll(actions.stream().map(factory::toEntity).toList())
                .stream().map(factory::toDomain).toList();
    }
}
