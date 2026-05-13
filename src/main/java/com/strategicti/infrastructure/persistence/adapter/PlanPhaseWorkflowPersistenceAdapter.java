package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.IPlanPhaseWorkflowRepositoryPort;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanChangeRequest;
import com.strategicti.domain.model.PlanPhaseVersion;
import com.strategicti.infrastructure.persistence.entity.PlanChangeRequestJpaEntity;
import com.strategicti.infrastructure.persistence.factory.PlanPhaseWorkflowPersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataPlanChangeRequestRepository;
import com.strategicti.infrastructure.persistence.repository.SpringDataPlanPhaseVersionRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public class PlanPhaseWorkflowPersistenceAdapter implements IPlanPhaseWorkflowRepositoryPort {
    private final SpringDataPlanChangeRequestRepository changeRequestRepository;
    private final SpringDataPlanPhaseVersionRepository versionRepository;
    private final PlanPhaseWorkflowPersistenceFactory factory;

    public PlanPhaseWorkflowPersistenceAdapter(
            SpringDataPlanChangeRequestRepository changeRequestRepository,
            SpringDataPlanPhaseVersionRepository versionRepository,
            PlanPhaseWorkflowPersistenceFactory factory
    ) {
        this.changeRequestRepository = changeRequestRepository;
        this.versionRepository = versionRepository;
        this.factory = factory;
    }

    @Override
    public PlanChangeRequest saveChangeRequest(PlanChangeRequest request) {
        PlanChangeRequestJpaEntity currentEntity = request.id() == null
                ? new PlanChangeRequestJpaEntity()
                : changeRequestRepository.findById(request.id()).orElseGet(PlanChangeRequestJpaEntity::new);
        return factory.toDomain(changeRequestRepository.save(factory.toEntity(request, currentEntity)));
    }

    @Override
    public Optional<PlanChangeRequest> findChangeRequestById(Long id) {
        return changeRequestRepository.findById(id).map(factory::toDomain);
    }

    @Override
    public void deleteChangeRequest(Long id) {
        changeRequestRepository.deleteById(id);
    }

    @Override
    public List<PlanChangeRequest> findChangeRequests(Long planId, PetiPhase phase) {
        return changeRequestRepository.findByPlanIdAndPhaseOrderByCreatedAtDesc(planId, phase).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public boolean existsChangeRequestWithStatus(
            Long planId,
            PetiPhase phase,
            Collection<PhaseChangeStatus> statuses
    ) {
        return changeRequestRepository.existsByPlanIdAndPhaseAndStatusIn(planId, phase, statuses);
    }

    @Override
    public PlanPhaseVersion saveVersion(PlanPhaseVersion version) {
        return factory.toDomain(versionRepository.save(factory.toEntity(version)));
    }

    @Override
    public List<PlanPhaseVersion> findVersions(Long planId, PetiPhase phase) {
        return versionRepository.findByPlanIdAndPhaseOrderByVersionNumberDesc(planId, phase).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public int nextVersionNumber(Long planId, PetiPhase phase) {
        return versionRepository.findFirstByPlanIdAndPhaseOrderByVersionNumberDesc(planId, phase)
                .map(version -> version.getVersionNumber() + 1)
                .orElse(1);
    }
}
