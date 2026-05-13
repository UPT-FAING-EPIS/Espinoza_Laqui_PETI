package com.strategicti.application.ports.out;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanChangeRequest;
import com.strategicti.domain.model.PlanPhaseVersion;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface IPlanPhaseWorkflowRepositoryPort {
    PlanChangeRequest saveChangeRequest(PlanChangeRequest request);

    Optional<PlanChangeRequest> findChangeRequestById(Long id);

    void deleteChangeRequest(Long id);

    List<PlanChangeRequest> findChangeRequests(Long planId, PetiPhase phase);

    boolean existsChangeRequestWithStatus(Long planId, PetiPhase phase, Collection<PhaseChangeStatus> statuses);

    PlanPhaseVersion saveVersion(PlanPhaseVersion version);

    List<PlanPhaseVersion> findVersions(Long planId, PetiPhase phase);

    int nextVersionNumber(Long planId, PetiPhase phase);
}
