package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.CameAction;
import com.strategicti.infrastructure.persistence.entity.CameActionJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class CamePersistenceFactory {

    public CameAction toDomain(CameActionJpaEntity entity) {
        return new CameAction(
                entity.getId(),
                entity.getPlanId(),
                entity.getQuadrant(),
                entity.getDescription(),
                entity.getRelatedFactor() == null ? "" : entity.getRelatedFactor(),
                entity.getPriority(),
                entity.getPosition(),
                entity.getUpdatedAt()
        );
    }

    public CameActionJpaEntity toEntity(CameAction action) {
        CameActionJpaEntity entity = new CameActionJpaEntity();
        if (action.id() != null) entity.setId(action.id());
        entity.setPlanId(action.planId());
        entity.setQuadrant(action.quadrant());
        entity.setDescription(action.description());
        entity.setRelatedFactor(action.relatedFactor());
        entity.setPriority(action.priority());
        entity.setPosition(action.position());
        return entity;
    }
}
