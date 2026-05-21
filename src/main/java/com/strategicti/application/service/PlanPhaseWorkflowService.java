package com.strategicti.application.service;

import com.strategicti.application.ports.out.IPlanPhaseWorkflowRepositoryPort;
import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePhaseChangeRequestCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.PhaseChangeEntryCommand;
import com.strategicti.application.usecase.PhaseChangeEntrySummary;
import com.strategicti.application.usecase.PhaseChangeRequestSummary;
import com.strategicti.application.usecase.PhaseVersionSummary;
import com.strategicti.application.usecase.ResourceNotFoundException;
import com.strategicti.application.usecase.ReviewPhaseChangeRequestCommand;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanChangeRequest;
import com.strategicti.domain.model.PlanPhaseChangeEntry;
import com.strategicti.domain.model.PlanPhaseVersion;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PlanPhaseWorkflowService {
    private final IPlanPhaseWorkflowRepositoryPort workflowRepository;
    private final IStrategicPlanRepositoryPort planRepository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final ObjectMapper objectMapper;
    private final Map<PetiPhase, PhaseContentApplier> contentAppliers;
    private final StrategicPlanContentMapper contentMapper;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public PlanPhaseWorkflowService(
            IPlanPhaseWorkflowRepositoryPort workflowRepository,
            IStrategicPlanRepositoryPort planRepository,
            IPlanningGroupRepositoryPort groupRepository,
            ObjectMapper objectMapper,
            List<PhaseContentApplier> contentAppliers,
            StrategicPlanContentMapper contentMapper
    ) {
        this.workflowRepository = workflowRepository;
        this.planRepository = planRepository;
        this.groupRepository = groupRepository;
        this.objectMapper = objectMapper;
        this.contentAppliers = contentAppliers.stream()
                .collect(Collectors.toMap(PhaseContentApplier::phase, Function.identity()));
        this.contentMapper = contentMapper;
    }

    @Transactional
    public PhaseChangeRequestSummary createChangeRequest(
            Long groupId,
            PetiPhase phase,
            CreatePhaseChangeRequestCommand command,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        String contentJson = contentAsJson(command.proposedContent());
        PlanChangeRequest request = PlanChangeRequest.draft(
                context.plan().id(),
                phase,
                contentMapper.clean(command.title()),
                contentMapper.clean(command.description()),
                contentJson,
                entries(command.entries()),
                viewer.id()
        );
        return toSummary(workflowRepository.saveChangeRequest(request));
    }

    @Transactional
    public PhaseChangeRequestSummary updateChangeRequest(
            Long groupId,
            PetiPhase phase,
            Long requestId,
            CreatePhaseChangeRequestCommand command,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        PlanChangeRequest request = findRequest(context.plan(), phase, requestId);
        assertCreatorOrLeader(context.group(), request, viewer);
        String contentJson = contentAsJson(command.proposedContent());
        return toSummary(workflowRepository.saveChangeRequest(request.updateDraft(
                contentMapper.clean(command.title()),
                contentMapper.clean(command.description()),
                contentJson,
                entries(command.entries())
        )));
    }

    @Transactional
    public PhaseChangeRequestSummary submitChangeRequest(
            Long groupId,
            PetiPhase phase,
            Long requestId,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        PlanChangeRequest request = findRequest(context.plan(), phase, requestId);
        assertCreatorOrLeader(context.group(), request, viewer);
        assertNoPendingRequest(context.plan(), phase);
        return toSummary(workflowRepository.saveChangeRequest(request.submit(viewer.id())));
    }

    @Transactional
    public PhaseChangeRequestSummary approveChangeRequest(
            Long groupId,
            PetiPhase phase,
            Long requestId,
            ReviewPhaseChangeRequestCommand command,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        assertLeader(context.group(), viewer);
        PlanChangeRequest request = findRequest(context.plan(), phase, requestId);

        progressPolicy.assertPhaseIsUnlocked(context.plan(), phase);
        StrategicPlan updatedPlan = applyContent(context.plan(), request);
        boolean completesPhase = completesPhase(updatedPlan, request);
        if (completesPhase) {
            progressPolicy.assertPhaseCanBeCompleted(updatedPlan, phase);
        }
        StrategicPlan savedPlan = planRepository.save(completesPhase ? updatedPlan.complete(phase) : updatedPlan);

        PlanChangeRequest approved = workflowRepository.saveChangeRequest(
                request.approve(viewer.id(), contentMapper.clean(command.comment()))
        );
        workflowRepository.saveVersion(PlanPhaseVersion.official(
                savedPlan.id(),
                phase,
                workflowRepository.nextVersionNumber(savedPlan.id(), phase),
                approved.id(),
                request.proposedContentJson(),
                request.createdByUserId(),
                viewer.id()
        ));
        return toSummary(approved);
    }

    @Transactional
    public PhaseChangeRequestSummary rejectChangeRequest(
            Long groupId,
            PetiPhase phase,
            Long requestId,
            ReviewPhaseChangeRequestCommand command,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        assertLeader(context.group(), viewer);
        PlanChangeRequest request = findRequest(context.plan(), phase, requestId);
        return toSummary(workflowRepository.saveChangeRequest(
                request.reject(viewer.id(), contentMapper.clean(command.comment()))
        ));
    }

    @Transactional
    public void discardChangeRequest(Long groupId, PetiPhase phase, Long requestId, AuthenticatedUser viewer) {
        WorkflowContext context = contextFor(groupId, viewer);
        PlanChangeRequest request = findRequest(context.plan(), phase, requestId);
        assertCreatorOrLeader(context.group(), request, viewer);
        if (request.status() != PhaseChangeStatus.DRAFT && request.status() != PhaseChangeStatus.REJECTED) {
            throw new IllegalStateException("Solo una solicitud en borrador o rechazada puede descartarse.");
        }
        workflowRepository.deleteChangeRequest(request.id());
    }

    @Transactional(readOnly = true)
    public List<PhaseChangeRequestSummary> listChangeRequests(
            Long groupId,
            PetiPhase phase,
            AuthenticatedUser viewer
    ) {
        WorkflowContext context = contextFor(groupId, viewer);
        return workflowRepository.findChangeRequests(context.plan().id(), phase).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PhaseVersionSummary> listVersions(Long groupId, PetiPhase phase, AuthenticatedUser viewer) {
        WorkflowContext context = contextFor(groupId, viewer);
        return workflowRepository.findVersions(context.plan().id(), phase).stream()
                .map(this::toSummary)
                .toList();
    }

    private WorkflowContext contextFor(Long groupId, AuthenticatedUser viewer) {
        PlanningGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro el grupo solicitado."));
        if (viewer.role() != SystemRole.ADMINISTRADOR && !group.hasMember(viewer.id())) {
            throw new ForbiddenOperationException("No pertenece al grupo solicitado.");
        }
        StrategicPlan plan = planRepository.findCurrentByGroupId(group.id())
                .orElseThrow(() -> new ResourceNotFoundException("El grupo aun no tiene un plan PETI activo."));
        return new WorkflowContext(group, plan);
    }

    private PlanChangeRequest findRequest(StrategicPlan plan, PetiPhase phase, Long requestId) {
        PlanChangeRequest request = workflowRepository.findChangeRequestById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("No se encontro la solicitud de cambio."));
        if (!request.planId().equals(plan.id()) || request.phase() != phase) {
            throw new ResourceNotFoundException("No se encontro la solicitud de cambio para esta fase.");
        }
        return request;
    }

    private StrategicPlan applyContent(StrategicPlan plan, PlanChangeRequest request) {
        PhaseContentApplier applier = contentAppliers.get(request.phase());
        if (applier == null) {
            return plan;
        }
        return applier.apply(plan, request.proposedContentJson());
    }

    private boolean completesPhase(StrategicPlan plan, PlanChangeRequest request) {
        PhaseContentApplier applier = contentAppliers.get(request.phase());
        return applier == null || applier.completesPhase(plan, request.proposedContentJson());
    }

    private void assertCreatorOrLeader(PlanningGroup group, PlanChangeRequest request, AuthenticatedUser viewer) {
        if (request.createdByUserId().equals(viewer.id()) || group.isLeader(viewer.id())) {
            return;
        }
        throw new ForbiddenOperationException("Solo el creador o el lider puede enviar esta solicitud.");
    }

    private void assertLeader(PlanningGroup group, AuthenticatedUser viewer) {
        if (group.isLeader(viewer.id())) {
            return;
        }
        throw new ForbiddenOperationException("Solo el lider del grupo puede revisar esta solicitud.");
    }

    private void assertNoPendingRequest(StrategicPlan plan, PetiPhase phase) {
        Collection<PhaseChangeStatus> pending = EnumSet.of(PhaseChangeStatus.PENDING_APPROVAL);
        if (workflowRepository.existsChangeRequestWithStatus(plan.id(), phase, pending)) {
            throw new IllegalStateException("Ya existe una solicitud pendiente para esta fase.");
        }
    }

    private List<PlanPhaseChangeEntry> entries(List<PhaseChangeEntryCommand> commands) {
        if (commands == null) {
            return List.of();
        }
        return commands.stream()
                .filter(command -> command != null)
                .map(command -> new PlanPhaseChangeEntry(
                        contentMapper.clean(command.fieldKey()),
                        contentMapper.clean(command.previousValue()),
                        contentMapper.clean(command.proposedValue())
                ))
                .filter(entry -> !entry.fieldKey().isBlank())
                .toList();
    }

    private String contentAsJson(JsonNode proposedContent) {
        try {
            return objectMapper.writeValueAsString(proposedContent);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto no tiene un formato valido.");
        }
    }

    private JsonNode json(String contentJson) {
        try {
            return objectMapper.readTree(contentJson);
        } catch (JacksonException exception) {
            return objectMapper.createObjectNode();
        }
    }

    private PhaseChangeRequestSummary toSummary(PlanChangeRequest request) {
        return new PhaseChangeRequestSummary(
                request.id(),
                request.planId(),
                request.phase(),
                request.status(),
                request.title(),
                request.description(),
                json(request.proposedContentJson()),
                request.entries().stream()
                        .map(entry -> new PhaseChangeEntrySummary(
                                entry.fieldKey(),
                                entry.previousValue(),
                                entry.proposedValue()
                        ))
                        .toList(),
                request.createdByUserId(),
                request.createdAt(),
                request.submittedAt(),
                request.reviewedByUserId(),
                request.reviewedAt(),
                request.reviewComment(),
                request.updatedAt()
        );
    }

    private PhaseVersionSummary toSummary(PlanPhaseVersion version) {
        return new PhaseVersionSummary(
                version.id(),
                version.planId(),
                version.phase(),
                version.versionNumber(),
                version.official(),
                version.sourceChangeRequestId(),
                json(version.contentJson()),
                version.createdByUserId(),
                version.approvedByUserId(),
                version.createdAt(),
                version.approvedAt()
        );
    }

    private record WorkflowContext(PlanningGroup group, StrategicPlan plan) {
    }
}
