package com.strategicti.application.service;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.application.usecase.ValueChainSummary;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DiagnosticService {
    private final IDiagnosticRepositoryPort diagnosticRepository;
    private final IStrategicPlanRepositoryPort planRepository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final DiagnosticContentMapper diagnosticContentMapper;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public DiagnosticService(
            IDiagnosticRepositoryPort diagnosticRepository,
            IStrategicPlanRepositoryPort planRepository,
            IPlanningGroupRepositoryPort groupRepository,
            DiagnosticContentMapper diagnosticContentMapper
    ) {
        this.diagnosticRepository = diagnosticRepository;
        this.planRepository = planRepository;
        this.groupRepository = groupRepository;
        this.diagnosticContentMapper = diagnosticContentMapper;
    }

    @Transactional(readOnly = true)
    public SwotSummary getSwotForGroup(Long groupId, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        return toSwotSummary(plan);
    }

    @Transactional
    public SwotSummary updateSwotForGroup(Long groupId, UpdateSwotCommand command, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        assertDiagnosticsEditable(plan);
        List<DiagnosticItem> items = diagnosticContentMapper.normalizeSwot(plan.id(), command, false);
        diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.FODA, items);
        return toSwotSummary(plan);
    }

    @Transactional(readOnly = true)
    public ValueChainSummary getValueChainForGroup(Long groupId, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        return toValueChainSummary(plan);
    }

    @Transactional
    public ValueChainSummary updateValueChainForGroup(
            Long groupId,
            UpdateValueChainCommand command,
            AuthenticatedUser viewer
    ) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        assertDiagnosticsEditable(plan);
        List<DiagnosticItem> items = diagnosticContentMapper.normalizeValueChainItems(plan.id(), command, false);
        List<DiagnosticAssessment> assessments = diagnosticContentMapper.normalizeValueChainAssessments(
                plan.id(),
                command,
                false
        );
        diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.VALUE_CHAIN, items);
        diagnosticRepository.replaceAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN, assessments);
        return toValueChainSummary(plan);
    }

    @Transactional(readOnly = true)
    public BcgSummary getBcgForGroup(Long groupId, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        return toBcgSummary(plan);
    }

    @Transactional
    public BcgSummary updateBcgForGroup(Long groupId, UpdateBcgCommand command, AuthenticatedUser viewer) {
        StrategicPlan plan = findPlanForAccessibleGroup(groupId, viewer);
        assertDiagnosticsEditable(plan);
        List<BcgPortfolioItem> products = diagnosticContentMapper.normalizeBcgPortfolio(plan.id(), command, false);
        List<DiagnosticItem> items = diagnosticContentMapper.normalizeBcgItems(plan.id(), command, false);
        diagnosticRepository.replaceBcgPortfolioItems(plan.id(), products);
        diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.BCG, items);
        return toBcgSummary(plan);
    }

    private SwotSummary toSwotSummary(StrategicPlan plan) {
        List<DiagnosticItem> items = diagnosticRepository.findItems(plan.id(), DiagnosticTool.FODA);
        return diagnosticContentMapper.toSwotSummary(plan.id(), items, plan.updatedAt());
    }

    private ValueChainSummary toValueChainSummary(StrategicPlan plan) {
        List<DiagnosticItem> items = diagnosticRepository.findItems(plan.id(), DiagnosticTool.VALUE_CHAIN);
        List<DiagnosticAssessment> assessments = diagnosticRepository.findAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN);
        return diagnosticContentMapper.toValueChainSummary(plan.id(), items, assessments, plan.updatedAt());
    }

    private BcgSummary toBcgSummary(StrategicPlan plan) {
        List<BcgPortfolioItem> products = diagnosticRepository.findBcgPortfolioItems(plan.id());
        List<DiagnosticItem> items = diagnosticRepository.findItems(plan.id(), DiagnosticTool.BCG);
        return diagnosticContentMapper.toBcgSummary(plan.id(), products, items, plan.updatedAt());
    }

    private void assertDiagnosticsEditable(StrategicPlan plan) {
        progressPolicy.assertPhaseIsUnlocked(plan, PetiPhase.DIAGNOSTICS);
        if (plan.isCompleted(PetiPhase.DIAGNOSTICS)) {
            throw new IllegalStateException("La fase de diagnostico ya fue aprobada. Cree una solicitud de cambio para modificarla.");
        }
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
        return planRepository.findCurrentByGroupId(group.id())
                .orElseThrow(() -> new ResourceNotFoundException("El grupo aun no tiene un plan PETI activo."));
    }
}
