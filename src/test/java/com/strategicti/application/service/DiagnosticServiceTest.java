package com.strategicti.application.service;

import com.strategicti.application.usecase.AuthenticatedUser;
import com.strategicti.application.usecase.BcgPortfolioItemCommand;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.ForbiddenOperationException;
import com.strategicti.application.usecase.DiagnosticFindingCommand;
import com.strategicti.application.usecase.PestResponseCommand;
import com.strategicti.application.usecase.PestSummary;
import com.strategicti.application.usecase.PorterResponseCommand;
import com.strategicti.application.usecase.PorterSummary;
import com.strategicti.application.usecase.SwotItemCommand;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdatePestCommand;
import com.strategicti.application.usecase.UpdatePorterCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.application.usecase.ValueChainActivityCommand;
import com.strategicti.application.usecase.ValueChainAssessmentCommand;
import com.strategicti.application.usecase.ValueChainSummary;
import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.BcgStrategicDecision;
import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PestFactor;
import com.strategicti.domain.model.PorterForce;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.ValueChainActivity;
import com.strategicti.support.InMemoryDiagnosticRepository;
import com.strategicti.support.InMemoryPlanningGroupRepository;
import com.strategicti.support.InMemoryStrategicPlanRepository;
import com.strategicti.support.InMemoryUserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DiagnosticServiceTest {
    private final StrategicPlanContentMapper planContentMapper = new StrategicPlanContentMapper();
    private final DiagnosticContentMapper diagnosticContentMapper = new DiagnosticContentMapper(planContentMapper);
    private final InMemoryDiagnosticRepository diagnosticRepository = new InMemoryDiagnosticRepository();
    private final InMemoryStrategicPlanRepository planRepository = new InMemoryStrategicPlanRepository();
    private final InMemoryPlanningGroupRepository groupRepository = new InMemoryPlanningGroupRepository();
    private final InMemoryUserAccountRepository userRepository = new InMemoryUserAccountRepository();
    private final DiagnosticService service = new DiagnosticService(
            diagnosticRepository,
            planRepository,
            groupRepository,
            diagnosticContentMapper
    );

    private PlanningGroup group;
    private UserAccount member;

    @BeforeEach
    void setUp() {
        member = userRepository.save(UserAccount.create("Editor", "PETI", "editor@test.com", "hash", SystemRole.USUARIO));
        group = groupRepository.save(PlanningGroup.create("Grupo PETI", "Equipo"));
        group = groupRepository.save(group.addMember(member, GroupRole.EDITOR));
        StrategicPlan plan = planRepository.save(StrategicPlan.newPlanForGroup(group.id()));
        planRepository.save(plan.complete(PetiPhase.IDENTITY));
    }

    @Test
    void updateSwotForGroupStoresGroupedItems() {
        SwotSummary summary = service.updateSwotForGroup(group.id(), swotCommand(), authenticated(member));

        assertEquals(1, summary.strengths().size());
        assertEquals("Equipo tecnico con experiencia", summary.strengths().getFirst().description());
        assertEquals(1, summary.opportunities().size());
        assertEquals(1, summary.weaknesses().size());
        assertEquals(1, summary.threats().size());
    }

    @Test
    void updateValueChainForGroupStoresActivitiesAndAssessmentScore() {
        ValueChainSummary summary = service.updateValueChainForGroup(
                group.id(),
                valueChainCommand(),
                authenticated(member)
        );

        assertEquals(1, summary.supportActivities().size());
        assertEquals(ValueChainActivity.DESARROLLO_TECNOLOGICO, summary.supportActivities().getFirst().activity());
        assertEquals(1, summary.primaryActivities().size());
        assertEquals(25, summary.answeredQuestions());
        assertEquals(25, summary.assessments().size());
        assertEquals(90, summary.totalScore());
        assertEquals(100, summary.maxScore());
        assertEquals(90, summary.scorePercentage());
        assertEquals(10, summary.improvementPercentage());
        assertEquals(2, summary.findings().size());
    }

    @Test
    void updateBcgForGroupStoresPortfolioAndClassifiesQuadrants() {
        BcgSummary summary = service.updateBcgForGroup(group.id(), bcgCommand(), authenticated(member));

        assertEquals(4, summary.products().size());
        assertEquals(10000.0, summary.totalSales(), 0.01);
        assertEquals(1, summary.stars());
        assertEquals(1, summary.questionMarks());
        assertEquals(1, summary.cashCows());
        assertEquals(1, summary.dogs());
        assertEquals(BcgQuadrant.ESTRELLA, summary.products().get(0).quadrant());
        assertEquals(BcgStrategicDecision.POTENCIAR, summary.products().get(0).strategicDecision());
        assertEquals(40.0, summary.products().get(0).salesPercentage(), 0.01);
        assertEquals("Dependencia de servicios con baja participacion", summary.weaknesses().getFirst());
    }

    @Test
    void updatePestStoresQuestionnaireAndCalculatesImpactByFactor() {
        PestSummary summary = service.updatePestForGroup(group.id(), pestCommand(), authenticated(member));

        assertEquals(25, summary.answeredQuestions());
        assertEquals(5, summary.factors().size());
        assertEquals(1.0, summary.factors().stream()
                .filter(factor -> factor.factor() == PestFactor.SOCIAL_DEMOGRAPHIC)
                .findFirst()
                .orElseThrow()
                .impactLevel());
        assertEquals(2, summary.findings().size());
        assertEquals(PestFactor.TECHNOLOGICAL.name(), summary.findings().getFirst().sourceDimension());
    }

    @Test
    void updatePorterStoresBalancedQuestionnaireAndCalculatesPressureByForce() {
        PorterSummary summary = service.updatePorterForGroup(group.id(), porterCommand(), authenticated(member));

        assertEquals(25, summary.answeredQuestions());
        assertEquals(5, summary.forces().size());
        assertEquals(100, summary.maxOverallScore());
        assertEquals(60, summary.pressurePercentage());
        assertEquals(1.0, summary.forces().stream()
                .filter(force -> force.force() == PorterForce.INDUSTRY_RIVALRY)
                .findFirst()
                .orElseThrow()
                .pressureLevel());
        assertEquals(2, summary.findings().size());
        assertEquals(PorterForce.SUPPLIER_POWER.name(), summary.findings().getFirst().sourceDimension());
    }

    @Test
    void updateSwotRejectsUnassignedUser() {
        UserAccount outsider = userRepository.save(UserAccount.create("No", "Miembro", "no@test.com", "hash", SystemRole.USUARIO));

        assertThrows(ForbiddenOperationException.class, () ->
                service.updateSwotForGroup(group.id(), swotCommand(), authenticated(outsider)));
    }

    @Test
    void updateSwotRejectsLockedDiagnostics() {
        PlanningGroup lockedGroup = groupRepository.save(PlanningGroup.create("Grupo bloqueado", "Equipo"));
        lockedGroup = groupRepository.save(lockedGroup.addMember(member, GroupRole.EDITOR));
        planRepository.save(StrategicPlan.newPlanForGroup(lockedGroup.id()));

        PlanningGroup finalLockedGroup = lockedGroup;
        assertThrows(IllegalStateException.class, () ->
                service.updateSwotForGroup(finalLockedGroup.id(), swotCommand(), authenticated(member)));
    }

    @Test
    void updateValueChainRejectsLockedDiagnostics() {
        PlanningGroup lockedGroup = groupRepository.save(PlanningGroup.create("Grupo bloqueado 2", "Equipo"));
        lockedGroup = groupRepository.save(lockedGroup.addMember(member, GroupRole.EDITOR));
        planRepository.save(StrategicPlan.newPlanForGroup(lockedGroup.id()));

        PlanningGroup finalLockedGroup = lockedGroup;
        assertThrows(IllegalStateException.class, () ->
                service.updateValueChainForGroup(finalLockedGroup.id(), valueChainCommand(), authenticated(member)));
    }

    @Test
    void updateBcgRejectsLockedDiagnostics() {
        PlanningGroup lockedGroup = groupRepository.save(PlanningGroup.create("Grupo bloqueado 3", "Equipo"));
        lockedGroup = groupRepository.save(lockedGroup.addMember(member, GroupRole.EDITOR));
        planRepository.save(StrategicPlan.newPlanForGroup(lockedGroup.id()));

        PlanningGroup finalLockedGroup = lockedGroup;
        assertThrows(IllegalStateException.class, () ->
                service.updateBcgForGroup(finalLockedGroup.id(), bcgCommand(), authenticated(member)));
    }

    private UpdateSwotCommand swotCommand() {
        return new UpdateSwotCommand(
                List.of(new SwotItemCommand("Equipo tecnico con experiencia", DiagnosticPriority.ALTA)),
                List.of(new SwotItemCommand("Automatizacion de procesos", DiagnosticPriority.MEDIA)),
                List.of(new SwotItemCommand("Documentacion incompleta", DiagnosticPriority.MEDIA)),
                List.of(new SwotItemCommand("Cambios regulatorios", DiagnosticPriority.BAJA))
        );
    }

    private UpdateValueChainCommand valueChainCommand() {
        return new UpdateValueChainCommand(
                List.of(new ValueChainActivityCommand(
                        ValueChainActivity.DESARROLLO_TECNOLOGICO,
                        "Uso de herramientas internas para automatizar servicios",
                        DiagnosticPriority.ALTA
                )),
                List.of(new ValueChainActivityCommand(
                        ValueChainActivity.OPERACIONES,
                        "Ejecucion y soporte de procesos academicos clave",
                        DiagnosticPriority.MEDIA
                )),
                IntStream.rangeClosed(1, 25)
                        .mapToObj(question -> new ValueChainAssessmentCommand(
                                question,
                                null,
                                null,
                                question <= 20 ? 4 : 2,
                                ""
                        ))
                        .toList(),
                "Se observa potencial de mejora en automatizacion.",
                List.of("Capacidad tecnica interna"),
                List.of("Procesos TI con alta dependencia manual"),
                List.of(
                        new DiagnosticFindingCommand(
                                ValueChainActivity.DESARROLLO_TECNOLOGICO.name(),
                                com.strategicti.domain.model.SwotCategory.FORTALEZA,
                                "Capacidad tecnica interna",
                                "Cuestionario interno",
                                "Acelera la automatizacion",
                                DiagnosticPriority.ALTA,
                                true
                        ),
                        new DiagnosticFindingCommand(
                                ValueChainActivity.OPERACIONES.name(),
                                com.strategicti.domain.model.SwotCategory.DEBILIDAD,
                                "Procesos TI con alta dependencia manual",
                                "Cuestionario interno",
                                "Reduce eficiencia operativa",
                                DiagnosticPriority.MEDIA,
                                true
                        )
                )
        );
    }

    private UpdateBcgCommand bcgCommand() {
        return new UpdateBcgCommand(
                List.of(
                        new BcgPortfolioItemCommand(
                                "Sistema academico",
                                "Servicio central con demanda creciente",
                                4000,
                                18,
                                1.6,
                                "Debe potenciarse"
                        ),
                        new BcgPortfolioItemCommand(
                                "Mesa de ayuda",
                                "Servicio emergente con baja participacion",
                                2500,
                                16,
                                0.7,
                                "Evaluar inversion"
                        ),
                        new BcgPortfolioItemCommand(
                                "Gestion documental",
                                "Servicio estable con alta participacion",
                                2000,
                                4,
                                1.4,
                                "Mantener eficiencia"
                        ),
                        new BcgPortfolioItemCommand(
                                "Aplicacion heredada",
                                "Servicio con baja demanda y baja participacion",
                                1500,
                                3,
                                0.4,
                                "Planificar retiro"
                        )
                ),
                10.0,
                1.0,
                "La cartera combina servicios maduros y servicios con potencial.",
                List.of("Portafolio con servicios estrella"),
                List.of("Dependencia de servicios con baja participacion")
        );
    }

    private UpdatePestCommand pestCommand() {
        return new UpdatePestCommand(
                IntStream.rangeClosed(1, 25)
                        .mapToObj(number -> new PestResponseCommand(number, number <= 5 ? 4 : 2))
                        .toList(),
                List.of(
                        new DiagnosticFindingCommand(
                                PestFactor.TECHNOLOGICAL.name(),
                                com.strategicti.domain.model.SwotCategory.OPORTUNIDAD,
                                "Mayor adopcion de servicios digitales",
                                "Resultados del cuestionario PEST",
                                "Permite ampliar los canales de servicio",
                                DiagnosticPriority.ALTA,
                                true
                        ),
                        new DiagnosticFindingCommand(
                                PestFactor.POLITICAL.name(),
                                com.strategicti.domain.model.SwotCategory.AMENAZA,
                                "Nuevas exigencias regulatorias",
                                "Cambios normativos",
                                "Incrementa los costos de cumplimiento",
                                DiagnosticPriority.MEDIA,
                                true
                        )
                )
        );
    }

    private UpdatePorterCommand porterCommand() {
        return new UpdatePorterCommand(
                IntStream.rangeClosed(1, 25)
                        .mapToObj(number -> new PorterResponseCommand(number, number <= 5 ? 4 : 2))
                        .toList(),
                List.of(
                        new DiagnosticFindingCommand(
                                PorterForce.SUPPLIER_POWER.name(),
                                com.strategicti.domain.model.SwotCategory.OPORTUNIDAD,
                                "Diversificacion posible de proveedores",
                                "Resultados del cuestionario Porter",
                                "Reduce la dependencia de insumos clave",
                                DiagnosticPriority.ALTA,
                                true
                        ),
                        new DiagnosticFindingCommand(
                                PorterForce.INDUSTRY_RIVALRY.name(),
                                com.strategicti.domain.model.SwotCategory.AMENAZA,
                                "Competidores con capacidades similares",
                                "Resultados del cuestionario Porter",
                                "Incrementa la presion sobre precios",
                                DiagnosticPriority.MEDIA,
                                true
                        )
                )
        );
    }

    private AuthenticatedUser authenticated(UserAccount user) {
        return new AuthenticatedUser(user.id(), user.email(), user.role());
    }
}
