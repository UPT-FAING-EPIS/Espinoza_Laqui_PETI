package com.strategicti.application.service;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CompanyProfileCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.IdentitySectionSummary;
import com.strategicti.application.usecase.PlanSummary;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.StrategicObjectiveCommand;
import com.strategicti.application.usecase.UpdateIdentityCommand;
import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseSnapshot;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicObjective;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class StrategicPlanService {
    private final IStrategicPlanRepositoryPort repository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public StrategicPlanService(
            IStrategicPlanRepositoryPort repository,
            IPlanningGroupRepositoryPort groupRepository
    ) {
        this.repository = repository;
        this.groupRepository = groupRepository;
    }

    @Transactional
    public PlanSummary getCurrentPlan() {
        StrategicPlan plan = repository.findCurrent().orElseGet(() -> repository.save(StrategicPlan.newPlan()));
        return toSummary(plan);
    }

    @Transactional
    public PlanSummary updateCompanyProfile(CompanyProfileCommand command) {
        StrategicPlan current = repository.findCurrent().orElseGet(StrategicPlan::newPlan);
        StrategicPlan updated = current.updateProfile(new CompanyProfile(
                clean(command.companyName()),
                clean(command.businessLine()),
                clean(command.description()),
                clean(command.mission()),
                clean(command.vision()),
                clean(command.valuesText())
        ));
        return toSummary(repository.save(updated));
    }

    @Transactional
    public PlanSummary completePhase(PetiPhase phase) {
        StrategicPlan current = repository.findCurrent().orElseGet(StrategicPlan::newPlan);
        progressPolicy.assertPhaseCanBeCompleted(current, phase);
        return toSummary(repository.save(current.complete(phase)));
    }

    @Transactional
    public PlanSummary createPlanForGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = findAccessibleGroup(groupId, viewer);
        repository.findCurrentByGroupId(group.id()).ifPresent(plan -> {
            throw new IllegalStateException("El grupo ya tiene un plan PETI activo.");
        });
        return toSummary(repository.save(StrategicPlan.newPlanForGroup(group.id())));
    }

    @Transactional(readOnly = true)
    public PlanSummary getPlanForGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = findAccessibleGroup(groupId, viewer);
        StrategicPlan plan = repository.findCurrentByGroupId(group.id())
                .orElseThrow(() -> new ResourceNotFoundException("El grupo aun no tiene un plan PETI activo."));
        return toSummary(plan);
    }

    @Transactional(readOnly = true)
    public IdentitySectionSummary getIdentityForGroup(Long groupId, AuthenticatedUser viewer) {
        return toIdentitySummary(findPlanForAccessibleGroup(groupId, viewer));
    }

    @Transactional
    public IdentitySectionSummary updateIdentityForGroup(
            Long groupId,
            UpdateIdentityCommand command,
            AuthenticatedUser viewer
    ) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        StrategicPlan updated = plan.updateIdentity(
                clean(command.mission()),
                clean(command.vision()),
                clean(command.valuesText()),
                normalizeObjectives(command.objectives())
        );
        return toIdentitySummary(repository.save(updated));
    }

    private PlanningGroup findAccessibleGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el grupo solicitado."));
        if (viewer.role() == SystemRole.ADMINISTRADOR || group.hasMember(viewer.id())) {
            return group;
        }
        throw new ForbiddenOperationException("No pertenece al grupo solicitado.");
    }

    private StrategicPlan findPlanForAccessibleGroup(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = findAccessibleGroup(groupId, viewer);
        return repository.findCurrentByGroupId(group.id())
                .orElseThrow(() -> new ResourceNotFoundException("El grupo aun no tiene un plan PETI activo."));
    }

    private PlanSummary toSummary(StrategicPlan plan) {
        List<PhaseSnapshot> phases = progressPolicy.snapshotsFor(plan);
        int totalProgress = phases.stream()
                .mapToInt(PhaseSnapshot::progress)
                .sum() / phases.size();
        return new PlanSummary(
                plan.id(),
                plan.groupId(),
                plan.profile(),
                plan.objectives(),
                plan.activePhase(),
                totalProgress,
                phases,
                plan.updatedAt()
        );
    }

    private IdentitySectionSummary toIdentitySummary(StrategicPlan plan) {
        return new IdentitySectionSummary(
                plan.id(),
                plan.groupId(),
                plan.profile().mission(),
                plan.profile().vision(),
                plan.profile().valuesText(),
                plan.objectives(),
                plan.updatedAt()
        );
    }

    private List<StrategicObjective> normalizeObjectives(List<StrategicObjectiveCommand> commands) {
        if (commands == null) {
            return List.of();
        }

        List<StrategicObjective> objectives = new ArrayList<>();
        for (StrategicObjectiveCommand command : commands) {
            if (command == null) {
                continue;
            }
            String generalObjective = clean(command.generalObjective());
            List<String> specificObjectives = cleanSpecificObjectives(command.specificObjectives());
            if (generalObjective.isBlank() && specificObjectives.isEmpty()) {
                continue;
            }
            if (generalObjective.isBlank()) {
                throw new IllegalArgumentException("El objetivo estrategico no puede estar vacio.");
            }
            objectives.add(new StrategicObjective(generalObjective, specificObjectives));
        }
        return objectives;
    }

    private List<String> cleanSpecificObjectives(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(this::clean)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
