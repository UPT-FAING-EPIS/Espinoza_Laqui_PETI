package com.strategicti.application.service;

import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.CreatePhaseChangeRequestCommand;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.PhaseChangeEntryCommand;
import com.strategicti.application.usecase.PhaseChangeRequestSummary;
import com.strategicti.application.usecase.PhaseVersionSummary;
import com.strategicti.application.usecase.ReviewPhaseChangeRequestCommand;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseChangeStatus;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.support.InMemoryDiagnosticRepository;
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
    private final DiagnosticContentMapper diagnosticContentMapper = new DiagnosticContentMapper(contentMapper);
    private final InMemoryDiagnosticRepository diagnosticRepository = new InMemoryDiagnosticRepository();
    private final InMemoryPlanPhaseWorkflowRepository workflowRepository = new InMemoryPlanPhaseWorkflowRepository();
    private final InMemoryStrategicPlanRepository planRepository = new InMemoryStrategicPlanRepository();
    private final InMemoryPlanningGroupRepository groupRepository = new InMemoryPlanningGroupRepository();
    private final InMemoryUserAccountRepository userRepository = new InMemoryUserAccountRepository();
    private final PlanPhaseWorkflowService service = new PlanPhaseWorkflowService(
            workflowRepository,
            planRepository,
            groupRepository,
            objectMapper,
            List.of(
                    new IdentityPhaseContentApplier(objectMapper, contentMapper),
                    new DiagnosticsPhaseContentApplier(objectMapper, diagnosticRepository, diagnosticContentMapper)
            ),
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

    @Test
    void creatorCanUpdateDraftBeforeSubmitting() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision inicial"),
                editorUser
        );

        PhaseChangeRequestSummary updated = service.updateChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                draft.id(),
                identityChangeCommand("Mision editada"),
                editorUser
        );

        assertEquals(PhaseChangeStatus.DRAFT, updated.status());
        assertEquals("Mision editada", updated.proposedContent().get("mission").asText());
    }

    @Test
    void pendingChangeCannotBeUpdatedAsDraft() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision inicial"),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.IDENTITY, draft.id(), editorUser);

        assertThrows(IllegalStateException.class, () -> service.updateChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                draft.id(),
                identityChangeCommand("Mision editada"),
                editorUser
        ));
    }

    @Test
    void creatorCanDiscardDraftChangeRequest() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.IDENTITY,
                identityChangeCommand("Mision a descartar"),
                editorUser
        );

        service.discardChangeRequest(group.id(), PetiPhase.IDENTITY, draft.id(), editorUser);

        assertTrue(service.listChangeRequests(group.id(), PetiPhase.IDENTITY, editorUser).isEmpty());
    }

    @Test
    void diagnosticsApprovalStoresFodaWithoutCompletingDiagnosticsPhase() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        AuthenticatedUser leaderUser = authenticated(leader);
        StrategicPlan identityCompletedPlan = planRepository.findCurrentByGroupId(group.id()).orElseThrow()
                .complete(PetiPhase.IDENTITY);
        planRepository.save(identityCompletedPlan);

        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                diagnosticsChangeCommand(),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.DIAGNOSTICS, draft.id(), editorUser);

        PhaseChangeRequestSummary approved = service.approveChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                draft.id(),
                new ReviewPhaseChangeRequestCommand("FODA validado"),
                leaderUser
        );

        StrategicPlan plan = planRepository.findCurrentByGroupId(group.id()).orElseThrow();
        assertEquals(PhaseChangeStatus.APPROVED, approved.status());
        assertEquals(4, diagnosticRepository.findItems(plan.id(), DiagnosticTool.FODA).size());
        assertEquals(PetiPhase.DIAGNOSTICS, plan.activePhase());
        assertTrue(!plan.isCompleted(PetiPhase.DIAGNOSTICS));
    }

    @Test
    void diagnosticsApprovalStoresValueChainWithoutCompletingDiagnosticsPhase() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        AuthenticatedUser leaderUser = authenticated(leader);
        StrategicPlan identityCompletedPlan = planRepository.findCurrentByGroupId(group.id()).orElseThrow()
                .complete(PetiPhase.IDENTITY);
        planRepository.save(identityCompletedPlan);

        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                valueChainChangeCommand(),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.DIAGNOSTICS, draft.id(), editorUser);

        service.approveChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                draft.id(),
                new ReviewPhaseChangeRequestCommand("Cadena validada"),
                leaderUser
        );

        StrategicPlan plan = planRepository.findCurrentByGroupId(group.id()).orElseThrow();
        assertEquals(2, diagnosticRepository.findAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN).size());
        assertEquals(4, diagnosticRepository.findAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN).getFirst().score());
        assertEquals(PetiPhase.DIAGNOSTICS, plan.activePhase());
        assertTrue(!plan.isCompleted(PetiPhase.DIAGNOSTICS));
    }

    @Test
    void diagnosticsApprovalStoresBcgWithoutCompletingDiagnosticsPhase() throws Exception {
        AuthenticatedUser editorUser = authenticated(editor);
        AuthenticatedUser leaderUser = authenticated(leader);
        StrategicPlan identityCompletedPlan = planRepository.findCurrentByGroupId(group.id()).orElseThrow()
                .complete(PetiPhase.IDENTITY);
        planRepository.save(identityCompletedPlan);

        PhaseChangeRequestSummary draft = service.createChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                bcgChangeCommand(),
                editorUser
        );
        service.submitChangeRequest(group.id(), PetiPhase.DIAGNOSTICS, draft.id(), editorUser);

        service.approveChangeRequest(
                group.id(),
                PetiPhase.DIAGNOSTICS,
                draft.id(),
                new ReviewPhaseChangeRequestCommand("BCG validado"),
                leaderUser
        );

        StrategicPlan plan = planRepository.findCurrentByGroupId(group.id()).orElseThrow();
        assertEquals(2, diagnosticRepository.findBcgPortfolioItems(plan.id()).size());
        assertEquals(2, diagnosticRepository.findItems(plan.id(), DiagnosticTool.BCG).size());
        assertEquals(PetiPhase.DIAGNOSTICS, plan.activePhase());
        assertTrue(!plan.isCompleted(PetiPhase.DIAGNOSTICS));
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

    private CreatePhaseChangeRequestCommand diagnosticsChangeCommand() throws Exception {
        return new CreatePhaseChangeRequestCommand(
                "Aprobar FODA",
                "Validacion inicial del diagnostico FODA.",
                objectMapper.readTree("""
                        {
                          "swot": {
                            "strengths": [
                              {"description": "Equipo tecnico con experiencia", "priority": "ALTA"}
                            ],
                            "opportunities": [
                              {"description": "Automatizacion de procesos", "priority": "MEDIA"}
                            ],
                            "weaknesses": [
                              {"description": "Documentacion incompleta", "priority": "MEDIA"}
                            ],
                            "threats": [
                              {"description": "Cambios regulatorios", "priority": "BAJA"}
                            ]
                          }
                        }
                        """),
                List.of(new PhaseChangeEntryCommand("swot", "", "FODA validado"))
        );
    }

    private CreatePhaseChangeRequestCommand valueChainChangeCommand() throws Exception {
        return new CreatePhaseChangeRequestCommand(
                "Aprobar cadena de valor",
                "Validacion inicial de cadena de valor.",
                objectMapper.readTree("""
                        {
                          "valueChain": {
                            "supportActivities": [
                              {
                                "activity": "DESARROLLO_TECNOLOGICO",
                                "description": "Automatizacion de servicios internos",
                                "priority": "ALTA"
                              }
                            ],
                            "primaryActivities": [
                              {
                                "activity": "OPERACIONES",
                                "description": "Soporte de procesos academicos",
                                "priority": "MEDIA"
                              }
                            ],
                            "assessments": [
                              {
                                "activity": "DESARROLLO_TECNOLOGICO",
                                "statement": "La tecnologia soporta ventajas internas.",
                                "score": 4,
                                "notes": "Buen avance"
                              },
                              {
                                "activity": "OPERACIONES",
                                "statement": "Los procesos estan documentados.",
                                "score": 3,
                                "notes": "Debe reforzarse"
                              }
                            ],
                            "observations": "Se observa potencial de mejora.",
                            "strengths": ["Capacidad tecnica interna"],
                            "weaknesses": ["Procesos manuales"]
                          }
                        }
                        """),
                List.of(new PhaseChangeEntryCommand("valueChain", "", "Cadena de valor validada"))
        );
    }

    private CreatePhaseChangeRequestCommand bcgChangeCommand() throws Exception {
        return new CreatePhaseChangeRequestCommand(
                "Aprobar BCG",
                "Validacion inicial de matriz BCG.",
                objectMapper.readTree("""
                        {
                          "bcg": {
                            "products": [
                              {
                                "name": "Sistema academico",
                                "description": "Servicio central con demanda creciente",
                                "annualSales": 4000,
                                "marketGrowthRate": 18,
                                "relativeMarketShare": 1.6,
                                "notes": "Debe potenciarse"
                              },
                              {
                                "name": "Mesa de ayuda",
                                "description": "Servicio emergente con baja participacion",
                                "annualSales": 2500,
                                "marketGrowthRate": 16,
                                "relativeMarketShare": 0.7,
                                "notes": "Evaluar inversion"
                              }
                            ],
                            "marketGrowthThreshold": 10,
                            "relativeMarketShareThreshold": 1,
                            "observations": "La cartera requiere priorizacion diferenciada.",
                            "strengths": ["Servicio academico con alto potencial"],
                            "weaknesses": []
                          }
                        }
                        """),
                List.of(new PhaseChangeEntryCommand("bcg", "", "BCG validado"))
        );
    }

    private AuthenticatedUser authenticated(UserAccount user) {
        return new AuthenticatedUser(user.id(), user.email(), user.role());
    }
}
