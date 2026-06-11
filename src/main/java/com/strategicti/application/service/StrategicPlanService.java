package com.strategicti.application.service;

import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CompanyProfileCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.IdentitySectionSummary;
import com.strategicti.application.usecase.PlanSummary;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.UpdateIdentityCommand;
import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseSnapshot;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StrategicPlanService {
    private final IStrategicPlanRepositoryPort repository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final StrategicPlanContentMapper contentMapper;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public StrategicPlanService(
            IStrategicPlanRepositoryPort repository,
            IPlanningGroupRepositoryPort groupRepository,
            StrategicPlanContentMapper contentMapper
    ) {
        this.repository = repository;
        this.groupRepository = groupRepository;
        this.contentMapper = contentMapper;
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
                contentMapper.clean(command.companyName()),
                contentMapper.clean(command.businessLine()),
                contentMapper.clean(command.description()),
                contentMapper.clean(command.mission()),
                contentMapper.clean(command.vision()),
                contentMapper.clean(command.valuesText())
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
        if (plan.isCompleted(PetiPhase.IDENTITY)) {
            throw new IllegalStateException("La fase de identidad ya fue aprobada. Cree una solicitud de cambio para modificarla.");
        }
        StrategicPlan withProfile = plan.updateProfile(new CompanyProfile(
                cleanOrCurrent(command.companyName(), plan.profile().companyName()),
                cleanOrCurrent(command.businessLine(), plan.profile().businessLine()),
                cleanOrCurrent(command.description(), plan.profile().description()),
                plan.profile().mission(),
                plan.profile().vision(),
                plan.profile().valuesText()
        ));
        StrategicPlan updated = withProfile.updateIdentity(
                contentMapper.clean(command.mission()),
                contentMapper.clean(command.vision()),
                contentMapper.clean(command.valuesText()),
                contentMapper.normalizeObjectives(command.objectives())
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

    private String cleanOrCurrent(String value, String current) {
        return value == null ? current : contentMapper.clean(value);
    }
}
