package com.strategicti.infrastructure.config;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.application.ports.out.IPlanningGroupRepositoryPort;
import com.strategicti.application.ports.out.IStrategicPlanRepositoryPort;
import com.strategicti.application.ports.out.IUserAccountRepositoryPort;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.GroupMember;
import com.strategicti.domain.model.GroupRole;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PlanningGroup;
import com.strategicti.domain.model.StrategicObjective;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.model.SwotCategory;
import com.strategicti.domain.model.SystemRole;
import com.strategicti.domain.model.UserAccount;
import com.strategicti.domain.model.ValueChainActivity;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Component
@ConditionalOnProperty(name = "app.seed.sample.enabled", havingValue = "true")
public class SampleDataSeeder {
    public static final String ADMIN_EMAIL = "admin@strategicti.test";
    public static final String ADMIN_PASSWORD = "Admin12345";
    public static final String USER_PASSWORD = "Usuario12345";

    private static final String VALUE_CHAIN_OBSERVATION = "OBSERVACION";
    private static final String VALUE_CHAIN_STRENGTH = "FORTALEZA";
    private static final String VALUE_CHAIN_WEAKNESS = "DEBILIDAD";
    private static final String BCG_OBSERVATION = "OBSERVACION";
    private static final String BCG_STRENGTH = "FORTALEZA";
    private static final String BCG_WEAKNESS = "DEBILIDAD";

    private final IUserAccountRepositoryPort userRepository;
    private final IPlanningGroupRepositoryPort groupRepository;
    private final IStrategicPlanRepositoryPort planRepository;
    private final IDiagnosticRepositoryPort diagnosticRepository;
    private final PasswordEncoder passwordEncoder;

    public SampleDataSeeder(
            IUserAccountRepositoryPort userRepository,
            IPlanningGroupRepositoryPort groupRepository,
            IStrategicPlanRepositoryPort planRepository,
            IDiagnosticRepositoryPort diagnosticRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.planRepository = planRepository;
        this.diagnosticRepository = diagnosticRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        SampleUsers users = seedUsers();

        seedProject(
                "PETI Comercial 2026",
                "Plan estrategico de TI para mejorar ventas, atencion digital y analitica comercial.",
                users.commercialLeader(),
                List.of(users.technologyAnalyst(), users.businessAnalyst()),
                commercialSample()
        );
        seedProject(
                "PETI Operaciones 2026",
                "Plan PETI orientado a procesos internos, integracion de sistemas y continuidad operativa.",
                users.technologyAnalyst(),
                List.of(users.petiConsultant(), users.commercialLeader()),
                operationsSample()
        );
        seedProject(
                "PETI Institucional 2026",
                "Plan de gobierno de TI para estandarizar servicios, seguridad y toma de decisiones.",
                users.businessAnalyst(),
                List.of(users.petiConsultant(), users.commercialLeader()),
                institutionalSample()
        );
    }

    private SampleUsers seedUsers() {
        UserAccount admin = findOrCreateUser(
                "Admin",
                "PETI",
                ADMIN_EMAIL,
                ADMIN_PASSWORD,
                SystemRole.ADMINISTRADOR
        );
        UserAccount commercialLeader = findOrCreateUser(
                "Valeria",
                "Ramos",
                "lider.peti@strategicti.test",
                USER_PASSWORD,
                SystemRole.USUARIO
        );
        UserAccount technologyAnalyst = findOrCreateUser(
                "Diego",
                "Salazar",
                "analista.ti@strategicti.test",
                USER_PASSWORD,
                SystemRole.USUARIO
        );
        UserAccount businessAnalyst = findOrCreateUser(
                "Mariana",
                "Torres",
                "analista.negocio@strategicti.test",
                USER_PASSWORD,
                SystemRole.USUARIO
        );
        UserAccount petiConsultant = findOrCreateUser(
                "Bruno",
                "Medina",
                "consultor.peti@strategicti.test",
                USER_PASSWORD,
                SystemRole.USUARIO
        );
        return new SampleUsers(admin, commercialLeader, technologyAnalyst, businessAnalyst, petiConsultant);
    }

    private UserAccount findOrCreateUser(
            String firstName,
            String lastName,
            String email,
            String password,
            SystemRole role
    ) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(UserAccount.create(
                        firstName,
                        lastName,
                        email,
                        passwordEncoder.encode(password),
                        role
                )));
    }

    private void seedProject(
            String groupName,
            String groupDescription,
            UserAccount leader,
            List<UserAccount> editors,
            ProjectSample sample
    ) {
        PlanningGroup group = findOrCreateGroup(groupName, groupDescription);
        group = ensureMember(group, leader, GroupRole.LIDER);
        for (UserAccount editor : editors) {
            group = ensureMember(group, editor, GroupRole.EDITOR);
        }

        StrategicPlan plan = findOrCreatePlan(group.id(), sample);
        seedDiagnostics(plan.id(), sample);
    }

    private PlanningGroup findOrCreateGroup(String name, String description) {
        return groupRepository.findAll().stream()
                .filter(group -> group.name().equals(name))
                .findFirst()
                .orElseGet(() -> groupRepository.save(PlanningGroup.create(name, description)));
    }

    private PlanningGroup ensureMember(PlanningGroup group, UserAccount user, GroupRole role) {
        GroupMember existingMember = group.members().stream()
                .filter(member -> member.userId().equals(user.id()))
                .findFirst()
                .orElse(null);
        if (existingMember == null) {
            return groupRepository.save(group.addMember(user, role));
        }
        if (existingMember.role() == role) {
            return group;
        }
        return groupRepository.save(group.updateMemberRole(user.id(), role));
    }

    private StrategicPlan findOrCreatePlan(Long groupId, ProjectSample sample) {
        return planRepository.findCurrentByGroupId(groupId)
                .orElseGet(() -> planRepository.save(new StrategicPlan(
                        null,
                        groupId,
                        sample.profile(),
                        sample.objectives(),
                        PetiPhase.DIAGNOSTICS,
                        Set.of(PetiPhase.IDENTITY),
                        Instant.now()
                )));
    }

    private void seedDiagnostics(Long planId, ProjectSample sample) {
        if (diagnosticRepository.findItems(planId, DiagnosticTool.FODA).isEmpty()) {
            diagnosticRepository.replaceItems(planId, DiagnosticTool.FODA, sample.swotItems(planId));
        }
        if (diagnosticRepository.findItems(planId, DiagnosticTool.VALUE_CHAIN).isEmpty()) {
            diagnosticRepository.replaceItems(planId, DiagnosticTool.VALUE_CHAIN, sample.valueChainItems(planId));
        }
        if (diagnosticRepository.findAssessments(planId, DiagnosticTool.VALUE_CHAIN).isEmpty()) {
            diagnosticRepository.replaceAssessments(
                    planId,
                    DiagnosticTool.VALUE_CHAIN,
                    sample.valueChainAssessments(planId)
            );
        }
        if (diagnosticRepository.findBcgPortfolioItems(planId).isEmpty()) {
            diagnosticRepository.replaceBcgPortfolioItems(planId, sample.bcgPortfolio(planId));
            diagnosticRepository.replaceItems(planId, DiagnosticTool.BCG, sample.bcgItems(planId));
        }
    }

    private ProjectSample commercialSample() {
        return new ProjectSample(
                new CompanyProfile(
                        "Nova Retail S.A.C.",
                        "Comercio y experiencia omnicanal",
                        "Empresa comercial que busca integrar ventas fisicas, e-commerce y atencion digital.",
                        "Ofrecer experiencias de compra simples, confiables y apoyadas en tecnologia.",
                        "Ser una referencia regional en comercio omnicanal y analitica de clientes.",
                        "Orientacion al cliente, mejora continua, transparencia e innovacion."
                ),
                List.of(new StrategicObjective(
                        "Fortalecer la plataforma digital comercial para incrementar la eficiencia de ventas.",
                        List.of(
                                "Integrar los canales de venta en una unica vista operativa.",
                                "Automatizar reportes comerciales y seguimiento de oportunidades."
                        )
                )),
                List.of(
                        swot(SwotCategory.FORTALEZA, "Equipo comercial con conocimiento del cliente recurrente.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.OPORTUNIDAD, "Crecimiento del canal e-commerce y adopcion de medios digitales.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.DEBILIDAD, "Informacion comercial fragmentada entre sistemas.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.AMENAZA, "Competidores con mayor madurez en personalizacion digital.", DiagnosticPriority.MEDIA)
                )
        );
    }

    private ProjectSample operationsSample() {
        return new ProjectSample(
                new CompanyProfile(
                        "Andes Operaciones S.A.C.",
                        "Servicios logisticos y soporte operativo",
                        "Organizacion enfocada en optimizar procesos internos y continuidad del servicio.",
                        "Garantizar operaciones eficientes mediante informacion confiable y procesos integrados.",
                        "Consolidar una operacion digital con trazabilidad completa de extremo a extremo.",
                        "Responsabilidad, eficiencia, colaboracion y seguridad."
                ),
                List.of(new StrategicObjective(
                        "Optimizar los procesos operativos mediante integracion y automatizacion de sistemas.",
                        List.of(
                                "Reducir reprocesos administrativos en operaciones criticas.",
                                "Mejorar la visibilidad de indicadores de productividad."
                        )
                )),
                List.of(
                        swot(SwotCategory.FORTALEZA, "Procesos operativos documentados y personal con experiencia.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.OPORTUNIDAD, "Disponibilidad de herramientas cloud para integrar operaciones.", DiagnosticPriority.MEDIA),
                        swot(SwotCategory.DEBILIDAD, "Registro manual de incidencias en varias areas.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.AMENAZA, "Interrupciones por dependencia de sistemas no integrados.", DiagnosticPriority.MEDIA)
                ),
                List.of(
                        valueChain(ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL, "Gobierno operativo con reportes parciales por sede."),
                        valueChain(ValueChainActivity.DESARROLLO_TECNOLOGICO, "Uso inicial de automatizacion para control de incidencias."),
                        valueChain(ValueChainActivity.OPERACIONES, "Procesos centrales con oportunidades de integracion."),
                        valueChain(ValueChainActivity.LOGISTICA_SALIDA, "Seguimiento de entregas con informacion dispersa."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_OBSERVATION, "La cadena requiere integracion de datos y estandarizacion de tableros."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_STRENGTH, "Conocimiento operativo acumulado en los equipos."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_WEAKNESS, "Dependencia de hojas de calculo para seguimiento diario.")
                ),
                List.of(
                        assessment(ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL, "Existen responsables definidos por proceso.", 3, "Falta tablero consolidado."),
                        assessment(ValueChainActivity.OPERACIONES, "Las tareas criticas cuentan con seguimiento periodico.", 3, "Persisten registros manuales."),
                        assessment(ValueChainActivity.DESARROLLO_TECNOLOGICO, "La tecnologia soporta parcialmente la mejora continua.", 2, "Priorizar integraciones.")
                ),
                List.of(
                        bcg("Mesa de ayuda operativa", "Servicio interno de soporte y continuidad.", 120000, 8.0, 1.3, "Mantener y mejorar tiempos de atencion."),
                        bcg("Monitoreo de procesos", "Servicio de alertas y seguimiento operativo.", 80000, 13.0, 0.8, "Evaluar inversion para aumentar adopcion."),
                        bcg("Reportes manuales", "Servicio de reporting no automatizado.", 35000, 2.0, 0.4, "Reestructurar gradualmente.")
                ),
                List.of(
                        diagnostic(DiagnosticTool.BCG, BCG_OBSERVATION, "La cartera operativa combina servicios maduros con iniciativas de automatizacion."),
                        diagnostic(DiagnosticTool.BCG, BCG_STRENGTH, "La mesa de ayuda mantiene alta participacion interna."),
                        diagnostic(DiagnosticTool.BCG, BCG_WEAKNESS, "Los reportes manuales consumen esfuerzo sin aportar escalabilidad.")
                )
        );
    }

    private ProjectSample institutionalSample() {
        return new ProjectSample(
                new CompanyProfile(
                        "Instituto Salud Digital",
                        "Servicios institucionales y gestion de informacion",
                        "Entidad orientada a ordenar gobierno de TI, seguridad y servicios digitales.",
                        "Gestionar servicios de TI seguros y alineados a las necesidades institucionales.",
                        "Ser una institucion con decisiones digitales basadas en datos y servicios confiables.",
                        "Etica, servicio, seguridad, colaboracion y excelencia."
                ),
                List.of(new StrategicObjective(
                        "Consolidar el gobierno de TI y la seguridad de la informacion institucional.",
                        List.of(
                                "Definir controles base para accesos, respaldos y continuidad.",
                                "Estandarizar el seguimiento de proyectos y servicios de TI."
                        )
                )),
                List.of(
                        swot(SwotCategory.FORTALEZA, "Compromiso directivo para ordenar la gestion de TI.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.OPORTUNIDAD, "Mayor demanda de servicios digitales institucionales.", DiagnosticPriority.MEDIA),
                        swot(SwotCategory.DEBILIDAD, "Roles y responsabilidades de TI aun poco formalizados.", DiagnosticPriority.ALTA),
                        swot(SwotCategory.AMENAZA, "Riesgos crecientes de seguridad y perdida de disponibilidad.", DiagnosticPriority.ALTA)
                ),
                List.of(
                        valueChain(ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL, "Comites de gestion con necesidad de indicadores TI."),
                        valueChain(ValueChainActivity.GESTION_RECURSOS_HUMANOS, "Capacitaciones digitales de frecuencia variable."),
                        valueChain(ValueChainActivity.DESARROLLO_TECNOLOGICO, "Aplicaciones internas con documentacion limitada."),
                        valueChain(ValueChainActivity.SERVICIOS, "Atencion a usuarios con base de conocimiento inicial."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_OBSERVATION, "El foco institucional debe ir hacia gobierno, seguridad y calidad de servicio."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_STRENGTH, "Alta disposicion para ordenar procesos."),
                        diagnostic(DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_WEAKNESS, "Documentacion tecnica insuficiente.")
                ),
                List.of(
                        assessment(ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL, "La direccion apoya iniciativas de mejora TI.", 4, "Convertir apoyo en politicas."),
                        assessment(ValueChainActivity.GESTION_RECURSOS_HUMANOS, "El personal requiere refuerzo en seguridad digital.", 2, "Plan de capacitacion trimestral."),
                        assessment(ValueChainActivity.SERVICIOS, "La atencion a usuarios tiene responsables definidos.", 3, "Formalizar SLA.")
                ),
                List.of(
                        bcg("Mesa de servicios TI", "Canal central de atencion y soporte institucional.", 95000, 7.0, 1.1, "Mantener y profesionalizar el servicio."),
                        bcg("Portal de tramites", "Servicio digital de atencion institucional.", 70000, 15.0, 0.7, "Invertir para elevar adopcion."),
                        bcg("Inventario manual", "Registro de activos gestionado con baja automatizacion.", 18000, 1.5, 0.3, "Sustituir por inventario integrado.")
                ),
                List.of(
                        diagnostic(DiagnosticTool.BCG, BCG_OBSERVATION, "Los servicios institucionales requieren priorizar adopcion y seguridad."),
                        diagnostic(DiagnosticTool.BCG, BCG_STRENGTH, "La mesa de servicios puede convertirse en base de mejora continua."),
                        diagnostic(DiagnosticTool.BCG, BCG_WEAKNESS, "Inventarios manuales reducen control y trazabilidad.")
                )
        );
    }

    private SwotSeed swot(SwotCategory category, String description, DiagnosticPriority priority) {
        return new SwotSeed(category, description, priority);
    }

    private ValueChainSeed valueChain(ValueChainActivity activity, String description) {
        return new ValueChainSeed(activity.name(), description);
    }

    private ValueChainSeed diagnostic(DiagnosticTool tool, String category, String description) {
        return new ValueChainSeed(category, description);
    }

    private AssessmentSeed assessment(ValueChainActivity activity, String statement, int score, String notes) {
        return new AssessmentSeed(activity, statement, score, notes);
    }

    private BcgSeed bcg(
            String name,
            String description,
            double annualSales,
            double marketGrowthRate,
            double relativeMarketShare,
            String notes
    ) {
        return new BcgSeed(name, description, annualSales, marketGrowthRate, relativeMarketShare, notes);
    }

    private record SampleUsers(
            UserAccount admin,
            UserAccount commercialLeader,
            UserAccount technologyAnalyst,
            UserAccount businessAnalyst,
            UserAccount petiConsultant
    ) {
    }

    private record ProjectSample(
            CompanyProfile profile,
            List<StrategicObjective> objectives,
            List<SwotSeed> swot,
            List<ValueChainSeed> valueChain,
            List<AssessmentSeed> assessments,
            List<BcgSeed> bcg,
            List<ValueChainSeed> bcgNotes
    ) {
        private ProjectSample(
                CompanyProfile profile,
                List<StrategicObjective> objectives,
                List<SwotSeed> swot
        ) {
            this(
                    profile,
                    objectives,
                    swot,
                    List.of(
                            new ValueChainSeed(
                                    ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL.name(),
                                    "Gestion base con responsabilidades asignadas."
                            ),
                            new ValueChainSeed(
                                    ValueChainActivity.DESARROLLO_TECNOLOGICO.name(),
                                    "Herramientas digitales en proceso de consolidacion."
                            ),
                            new ValueChainSeed(
                                    ValueChainActivity.MARKETING_VENTAS.name(),
                                    "Canales digitales con potencial de crecimiento."
                            ),
                            new ValueChainSeed(VALUE_CHAIN_OBSERVATION, "Se requiere priorizar integraciones y medicion."),
                            new ValueChainSeed(VALUE_CHAIN_STRENGTH, "Equipo con apertura al cambio digital."),
                            new ValueChainSeed(VALUE_CHAIN_WEAKNESS, "Indicadores aun dispersos.")
                    ),
                    List.of(
                            new AssessmentSeed(
                                    ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
                                    "La gestion cuenta con responsables funcionales.",
                                    3,
                                    "Formalizar seguimiento."
                            ),
                            new AssessmentSeed(
                                    ValueChainActivity.MARKETING_VENTAS,
                                    "Los canales digitales generan informacion accionable.",
                                    2,
                                    "Mejorar integracion."
                            )
                    ),
                    List.of(
                            new BcgSeed("Canal e-commerce", "Canal digital de ventas.", 150000, 14.0, 1.2, "Potenciar inversion."),
                            new BcgSeed("App de fidelizacion", "Servicio de retencion de clientes.", 65000, 16.0, 0.6, "Evaluar crecimiento."),
                            new BcgSeed("Catalogo legacy", "Catalogo antiguo no integrado.", 25000, 1.0, 0.3, "Retirar progresivamente.")
                    ),
                    List.of(
                            new ValueChainSeed(BCG_OBSERVATION, "La cartera muestra oportunidades digitales de alto crecimiento."),
                            new ValueChainSeed(BCG_STRENGTH, "El e-commerce sostiene mayor aporte comercial."),
                            new ValueChainSeed(BCG_WEAKNESS, "Los sistemas legacy limitan escalabilidad.")
                    )
            );
        }

        private List<DiagnosticItem> swotItems(Long planId) {
            int position = 0;
            List<DiagnosticItem> items = new java.util.ArrayList<>();
            for (SwotSeed seed : swot) {
                items.add(DiagnosticItem.foda(planId, seed.category(), seed.description(), seed.priority(), position++));
            }
            return items;
        }

        private List<DiagnosticItem> valueChainItems(Long planId) {
            int position = 0;
            List<DiagnosticItem> items = new java.util.ArrayList<>();
            for (ValueChainSeed seed : valueChain) {
                items.add(DiagnosticItem.valueChain(
                        planId,
                        seed.category(),
                        seed.description(),
                        DiagnosticPriority.MEDIA,
                        position++
                ));
            }
            return items;
        }

        private List<DiagnosticAssessment> valueChainAssessments(Long planId) {
            int position = 0;
            List<DiagnosticAssessment> values = new java.util.ArrayList<>();
            for (AssessmentSeed seed : assessments) {
                values.add(DiagnosticAssessment.valueChain(
                        planId,
                        seed.activity(),
                        seed.statement(),
                        seed.score(),
                        seed.notes(),
                        position++
                ));
            }
            return values;
        }

        private List<BcgPortfolioItem> bcgPortfolio(Long planId) {
            double totalSales = bcg.stream().mapToDouble(BcgSeed::annualSales).sum();
            int position = 0;
            List<BcgPortfolioItem> products = new java.util.ArrayList<>();
            for (BcgSeed seed : bcg) {
                double salesPercentage = totalSales == 0 ? 0 : Math.round((seed.annualSales() * 10000.0) / totalSales) / 100.0;
                products.add(BcgPortfolioItem.create(
                        planId,
                        seed.name(),
                        seed.description(),
                        seed.annualSales(),
                        salesPercentage,
                        seed.marketGrowthRate(),
                        seed.relativeMarketShare(),
                        BcgPortfolioItem.DEFAULT_MARKET_GROWTH_THRESHOLD,
                        BcgPortfolioItem.DEFAULT_RELATIVE_MARKET_SHARE_THRESHOLD,
                        seed.notes(),
                        position++
                ));
            }
            return products;
        }

        private List<DiagnosticItem> bcgItems(Long planId) {
            int position = 0;
            List<DiagnosticItem> items = new java.util.ArrayList<>();
            for (ValueChainSeed seed : bcgNotes) {
                items.add(DiagnosticItem.bcg(
                        planId,
                        seed.category(),
                        seed.description(),
                        DiagnosticPriority.MEDIA,
                        position++
                ));
            }
            return items;
        }
    }

    private record SwotSeed(SwotCategory category, String description, DiagnosticPriority priority) {
    }

    private record ValueChainSeed(String category, String description) {
    }

    private record AssessmentSeed(ValueChainActivity activity, String statement, int score, String notes) {
    }

    private record BcgSeed(
            String name,
            String description,
            double annualSales,
            double marketGrowthRate,
            double relativeMarketShare,
            String notes
    ) {
    }
}
