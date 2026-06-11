package com.strategicti.application.service;

import com.strategicti.application.ports.out.ICameRepositoryPort;
import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CameActionCommand;
import com.strategicti.application.usecase.CameActionSummary;
import com.strategicti.application.usecase.CameSummary;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.UpdateCameCommand;
import com.strategicti.domain.model.CameAction;
import com.strategicti.domain.model.CameQuadrant;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class CameService {

    private final ICameRepositoryPort cameRepository;
    private final IStrategicPlanRepositoryPort planRepository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public CameService(
            ICameRepositoryPort cameRepository,
            IStrategicPlanRepositoryPort planRepository,
            IPlanningGroupRepositoryPort groupRepository
    ) {
        this.cameRepository = cameRepository;
        this.planRepository = planRepository;
        this.groupRepository = groupRepository;
    }

    @Transactional(readOnly = true)
    public CameSummary getCameForGroup(Long groupId, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        return toCameSummary(plan);
    }

    @Transactional
    public CameSummary updateCameForGroup(Long groupId, UpdateCameCommand command, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        progressPolicy.assertPhaseIsUnlocked(plan, PetiPhase.FORMULATION);

        replaceQuadrant(plan.id(), CameQuadrant.CORREGIR, command.corregir());
        replaceQuadrant(plan.id(), CameQuadrant.AFRONTAR, command.afrontar());
        replaceQuadrant(plan.id(), CameQuadrant.MANTENER, command.mantener());
        replaceQuadrant(plan.id(), CameQuadrant.EXPLOTAR, command.explotar());

        return toCameSummary(plan);
    }

    private void replaceQuadrant(Long planId, CameQuadrant quadrant, List<CameActionCommand> commands) {
        if (commands == null) return;
        int[] pos = {0};
        List<CameAction> actions = commands.stream()
                .filter(c -> c != null && c.description() != null && !c.description().isBlank())
                .map(c -> CameAction.create(
                        planId,
                        quadrant,
                        c.description().trim(),
                        c.relatedFactor() == null ? "" : c.relatedFactor().trim(),
                        c.priority(),
                        pos[0]++
                ))
                .toList();
        cameRepository.replaceByPlanIdAndQuadrant(planId, quadrant, actions);
    }

    private CameSummary toCameSummary(StrategicPlan plan) {
        List<CameAction> all = cameRepository.findByPlanId(plan.id());
        Instant updatedAt = all.stream().map(CameAction::updatedAt)
                .max(Comparator.naturalOrder()).orElse(plan.updatedAt());
        return new CameSummary(
                plan.id(),
                toSummaryList(all, CameQuadrant.CORREGIR),
                toSummaryList(all, CameQuadrant.AFRONTAR),
                toSummaryList(all, CameQuadrant.MANTENER),
                toSummaryList(all, CameQuadrant.EXPLOTAR),
                updatedAt
        );
    }

    private List<CameActionSummary> toSummaryList(List<CameAction> all, CameQuadrant quadrant) {
        return all.stream()
                .filter(a -> a.quadrant() == quadrant)
                .sorted(Comparator.comparingInt(CameAction::position))
                .map(a -> new CameActionSummary(a.id(), a.quadrant(), a.description(), a.relatedFactor(), a.priority(), a.position()))
                .toList();
    }

    private PlanningGroup findAccessibleGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el grupo solicitado."));
        if (viewer.role() == SystemRole.ADMINISTRADOR || group.hasMember(viewer.id())) return group;
        throw new ForbiddenOperationException("No pertenece al grupo solicitado.");
    }

    private StrategicPlan findPlanForAccessibleGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = findAccessibleGroup(groupId, viewer);
        return planRepository.findCurrentByGroupId(group.id())
                .orElseThrow(() -> new ResourceNotFoundException("El grupo aun no tiene un plan PETI activo."));
    }
}
