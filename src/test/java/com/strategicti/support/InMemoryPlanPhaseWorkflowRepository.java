package com.strategicti.support;

import com.strategicti.application.ports.out.IPlanPhaseWorkflowRepositoryPort;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanChangeRequest;
import com.strategicti.domain.model.PlanPhaseVersion;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class InMemoryPlanPhaseWorkflowRepository implements IPlanPhaseWorkflowRepositoryPort {
    private final Map<Long, PlanChangeRequest> requests = new LinkedHashMap<>();
    private final Map<Long, PlanPhaseVersion> versions = new LinkedHashMap<>();
    private long requestSequence;
    private long versionSequence;

    @Override
    public PlanChangeRequest saveChangeRequest(PlanChangeRequest request) {
        Long id = request.id() == null ? ++requestSequence : request.id();
        PlanChangeRequest persisted = new PlanChangeRequest(
                id,
                request.planId(),
                request.phase(),
                request.status(),
                request.title(),
                request.description(),
                request.proposedContentJson(),
                request.entries(),
                request.createdByUserId(),
                request.createdAt(),
                request.submittedAt(),
                request.reviewedByUserId(),
                request.reviewedAt(),
                request.reviewComment(),
                request.updatedAt()
        );
        requests.put(id, persisted);
        return persisted;
    }

    @Override
    public Optional<PlanChangeRequest> findChangeRequestById(Long id) {
        return Optional.ofNullable(requests.get(id));
    }

    @Override
    public void deleteChangeRequest(Long id) {
        requests.remove(id);
    }

    @Override
    public List<PlanChangeRequest> findChangeRequests(Long planId, PetiPhase phase) {
        return requests.values().stream()
                .filter(request -> request.planId().equals(planId) && request.phase() == phase)
                .sorted(Comparator.comparing(PlanChangeRequest::createdAt).reversed())
                .toList();
    }

    @Override
    public boolean existsChangeRequestWithStatus(
            Long planId,
            PetiPhase phase,
            Collection<PhaseChangeStatus> statuses
    ) {
        return requests.values().stream()
                .anyMatch(request -> request.planId().equals(planId)
                        && request.phase() == phase
                        && statuses.contains(request.status()));
    }

    @Override
    public PlanPhaseVersion saveVersion(PlanPhaseVersion version) {
        Long id = version.id() == null ? ++versionSequence : version.id();
        PlanPhaseVersion persisted = new PlanPhaseVersion(
                id,
                version.planId(),
                version.phase(),
                version.versionNumber(),
                version.official(),
                version.sourceChangeRequestId(),
                version.contentJson(),
                version.createdByUserId(),
                version.approvedByUserId(),
                version.createdAt(),
                version.approvedAt()
        );
        versions.put(id, persisted);
        return persisted;
    }

    @Override
    public List<PlanPhaseVersion> findVersions(Long planId, PetiPhase phase) {
        return versions.values().stream()
                .filter(version -> version.planId().equals(planId) && version.phase() == phase)
                .sorted(Comparator.comparing(PlanPhaseVersion::versionNumber).reversed())
                .toList();
    }

    @Override
    public int nextVersionNumber(Long planId, PetiPhase phase) {
        return findVersions(planId, phase).stream()
                .mapToInt(PlanPhaseVersion::versionNumber)
                .max()
                .orElse(0) + 1;
    }
}
