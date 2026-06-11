package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.domain.model.CameQuadrant;
import com.strategicti.infrastructure.persistence.entity.CameActionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataCameActionRepository extends JpaRepository<CameActionJpaEntity, Long> {
    List<CameActionJpaEntity> findByPlanIdOrderByQuadrantAscPositionAsc(Long planId);
    List<CameActionJpaEntity> findByPlanIdAndQuadrantOrderByPositionAsc(Long planId, CameQuadrant quadrant);
    void deleteByPlanIdAndQuadrant(Long planId, CameQuadrant quadrant);
}
