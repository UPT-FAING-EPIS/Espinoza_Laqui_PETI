package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.infrastructure.persistence.entity.PlanChangeRequestJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface SpringDataPlanChangeRequestRepository extends JpaRepository<PlanChangeRequestJpaEntity, Long> {
    List<PlanChangeRequestJpaEntity> findByPlanIdAndPhaseOrderByCreatedAtDesc(Long planId, PetiPhase phase);

    boolean existsByPlanIdAndPhaseAndStatusIn(
            Long planId,
            PetiPhase phase,
            Collection<PhaseChangeStatus> statuses
    );
}
