package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.infrastructure.persistence.entity.PlanPhaseVersionJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataPlanPhaseVersionRepository extends JpaRepository<PlanPhaseVersionJpaEntity, Long> {
    List<PlanPhaseVersionJpaEntity> findByPlanIdAndPhaseOrderByVersionNumberDesc(Long planId, PetiPhase phase);

    Optional<PlanPhaseVersionJpaEntity> findFirstByPlanIdAndPhaseOrderByVersionNumberDesc(Long planId, PetiPhase phase);
}
