package com.strategicti.application.service;

import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePhaseChangeRequestCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.PhaseChangeEntryCommand;
import com.strategicti.application.usecase.PhaseChangeRequestSummary;
import com.strategicti.application.usecase.PhaseVersionSummary;
import com.strategicti.application.usecase.ReviewPhaseChangeRequestCommand;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.support.InMemoryPlanPhaseWorkflowRepository;
import com.strategicti.support.InMemoryPlanningGroupRepository;
import com.strategicti.support.InMemoryStrategicPlanRepository;
import com.strategicti.support.InMemoryUserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlanPhaseWorkflowServiceTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StrategicPlanContentMapper contentMapper = new StrategicPlanContentMapper();
    private final InMemoryPlanPhaseWorkflowRepository workflowRepository = new InMemoryPlanPhaseWorkflowRepository();
    private final InMemoryStrategicPlanRepository planRepository = new InMemoryStrategicPlanRepository();
    private final InMemoryPlanningGroupRepository groupRepository = new InMemoryPlanningGroupRepository();
    private final InMemoryUserAccountRepository userRepository = new InMemoryUserAccountRepository();
    private final PlanPhaseWorkflowService service = new PlanPhaseWorkflowService(
            workflowRepository,
            planRepository,
            groupRepository,
            objectMapper,
            List.of(new IdentityPhaseContentApplier(objectMapper, contentMapper)),
            contentMapper
    );

    private PlanningGroup group;
    private UserAccount leader;
    private UserAccount editor;

    @BeforeEach
    void setUp() {
        leader = userRepository.save(UserAccount.create("Lider", "PETI", "lider@test.com", "hash", SystemRole.USUARIO));
        editor = userRepository.save(UserAccount.create("Editor", "PETI", "editor@test.com", "hash", SystemRole.USUARIO));
        group = groupRepository.save(PlanningGroup.create("Grupo PETI", "Equipo"));
        group = groupRepository.save(group.addMember(leader, GroupRole.LIDER));
        group = groupRepository.save(group.addMember(editor, GroupRole.EDITOR));
        planRepository.save(StrategicPlan.newPlanForGroup(group.id()));
    }

    @Test
    void leaderApprovalCreatesOfficialVersionAndCompletesPhase() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        AuthenticatedUser leaderUser = authenticated(leader);

        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision aprobada"),
                editorUser
        );
        assertEquals(PhaseChangeStatus.DRAFT, draft.status());

        PhaseChangeRequestSummary pending = service.submitChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                draft.id(),
                editorUser
        );
        assertEquals(PhaseChangeStatus.PENDING_APPROVAL, pending.status());

        PhaseChangeRequestSummary approved = service.approveChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                draft.id(),
                new ReviewPhaseChangeRequestCommand("Conforme"),
                leaderUser
        );

        assertEquals(PhaseChangeStatus.APPROVED, approved.status());

        StrategicPlan plan = planRepository.findCurrentByGroupId(group.id()).orElseThrow();
        assertEquals("Mision aprobada", plan.profile().mission());
        assertTrue(plan.isCompleted(PetiPhase.IDENTITY));
        assertEquals(PetiPhase.DIAGNOSTICS, plan.activePhase());

        List<PhaseVersionSummary> versions = service.listVersions(group.id(), PetiPhase.IDENTITY, leaderUser);
        assertEquals(1, versions.size());
        assertEquals(1, versions.getFirst().versionNumber());
        assertEquals("Mision aprobada", versions.getFirst().content().get("mission").asText());
    }

    @Test
    void nonLeaderCannotApprovePendingChangeRequest() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision enviada"),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.IDENTITY, draft.id(), editorUser);

        assertThrows(ForbiddenOperationException.class, () -> service.approveChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                draft.id(),
                new ReviewPhaseChangeRequestCommand("No deberia"),
                editorUser
        ));
    }

    @Test
    void onlyOnePendingRequestPerPhaseIsAllowed() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        PhaseChangeRequestSummary first = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision uno"),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.IDENTITY, first.id(), editorUser);

        PhaseChangeRequestSummary second = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision dos"),
                editorUser
        );

        assertThrows(IllegalStateException.class, () -> service.submitChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                second.id(),
                editorUser
        ));
    }

    private CreatePhaseChangeRequestCommand identityChangeCommand(String mission) throws Exception {
        return new CreatePhaseChangeRequestCommand(
                "Actualizar identidad",
                "Ajuste de contenido de la fase de identidad.",
                objectMapper.readTree("""
                        {
                          "companyName": "Empresa PETI",
                          "businessLine": "Educacion",
                          "description": "Organizacion de referencia",
                          "mission": "%s",
                          "vision": "Vision validada",
                          "valuesText": "Transparencia\\nInnovacion",
                          "objectives": [
                            {
                              "generalObjective": "Alinear TI con la estrategia institucional",
                              "specificObjectives": ["Priorizar iniciativas digitales"]
                            }
                          ]
                        }
                        """.formatted(mission)),
                List.of(new PhaseChangeEntryCommand("mission", "", mission))
        );
    }

    private AuthenticatedUser authenticated(UserAccount user) {
        return new AuthenticatedUser(user.id(), user.email(), user.role());
    }
}
