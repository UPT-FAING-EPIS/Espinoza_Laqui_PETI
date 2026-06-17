package com.strategicti.application.service;

import com.strategicti.application.usecase.BcgCompetitorSaleCommand;
import com.strategicti.application.usecase.BcgCompetitorSaleSummary;
import com.strategicti.application.usecase.BcgPortfolioItemCommand;
import com.strategicti.application.usecase.BcgPortfolioItemSummary;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.DiagnosticFindingCommand;
import com.strategicti.application.usecase.DiagnosticFindingSummary;
import com.strategicti.application.usecase.PestFactorSummary;
import com.strategicti.application.usecase.PestQuestionSummary;
import com.strategicti.application.usecase.PestResponseCommand;
import com.strategicti.application.usecase.PestSummary;
import com.strategicti.application.usecase.PorterForceSummary;
import com.strategicti.application.usecase.PorterQuestionSummary;
import com.strategicti.application.usecase.PorterResponseCommand;
import com.strategicti.application.usecase.PorterSummary;
import com.strategicti.application.usecase.SwotItemCommand;
import com.strategicti.application.usecase.SwotItemSummary;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateDiagnosticFindingsCommand;
import com.strategicti.application.usecase.UpdatePestCommand;
import com.strategicti.application.usecase.UpdatePorterCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.application.usecase.ValueChainActivityCommand;
import com.strategicti.application.usecase.ValueChainActivitySummary;
import com.strategicti.application.usecase.ValueChainAssessmentCommand;
import com.strategicti.application.usecase.ValueChainAssessmentSummary;
import com.strategicti.application.usecase.ValueChainDimensionSummary;
import com.strategicti.application.usecase.ValueChainQuestionSummary;
import com.strategicti.application.usecase.ValueChainSummary;
import com.strategicti.domain.model.BcgCompetitorSale;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticFinding;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.PestFactor;
import com.strategicti.domain.model.PestQuestion;
import com.strategicti.domain.model.PorterForce;
import com.strategicti.domain.model.PorterQuestion;
import com.strategicti.domain.model.SwotCategory;
import com.strategicti.domain.model.ValueChainActivity;
import com.strategicti.domain.model.ValueChainActivityType;
import com.strategicti.domain.model.ValueChainDimension;
import com.strategicti.domain.model.ValueChainQuestion;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class DiagnosticContentMapper {
    private static final String VALUE_CHAIN_OBSERVATION = "OBSERVACION";
    private static final String VALUE_CHAIN_STRENGTH = "FORTALEZA";
    private static final String VALUE_CHAIN_WEAKNESS = "DEBILIDAD";
    private static final String BCG_OBSERVATION = "OBSERVACION";
    private static final String BCG_STRENGTH = "FORTALEZA";
    private static final String BCG_WEAKNESS = "DEBILIDAD";

    private final StrategicPlanContentMapper contentMapper;

    public DiagnosticContentMapper(StrategicPlanContentMapper contentMapper) {
        this.contentMapper = contentMapper;
    }

    public List<DiagnosticItem> normalizeSwot(Long planId, UpdateSwotCommand command, boolean requireComplete) {
        if (command == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El contenido FODA es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticItem> items = new ArrayList<>();
        int position = 0;
        position = addSwotItems(items, planId, SwotCategory.FORTALEZA, command.strengths(), position);
        position = addSwotItems(items, planId, SwotCategory.OPORTUNIDAD, command.opportunities(), position);
        position = addSwotItems(items, planId, SwotCategory.DEBILIDAD, command.weaknesses(), position);
        addSwotItems(items, planId, SwotCategory.AMENAZA, command.threats(), position);

        if (requireComplete) {
            assertHasCategory(items, SwotCategory.FORTALEZA);
            assertHasCategory(items, SwotCategory.OPORTUNIDAD);
            assertHasCategory(items, SwotCategory.DEBILIDAD);
            assertHasCategory(items, SwotCategory.AMENAZA);
        }
        return items;
    }

    public SwotSummary toSwotSummary(Long planId, List<DiagnosticItem> items, Instant fallbackUpdatedAt) {
        Instant updatedAt = items.stream()
                .map(DiagnosticItem::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        return new SwotSummary(
                planId,
                summaries(items, SwotCategory.FORTALEZA),
                summaries(items, SwotCategory.OPORTUNIDAD),
                summaries(items, SwotCategory.DEBILIDAD),
                summaries(items, SwotCategory.AMENAZA),
                updatedAt
        );
    }

    public List<DiagnosticItem> normalizeValueChainItems(
            Long planId,
            UpdateValueChainCommand command,
            boolean requireComplete
    ) {
        if (command == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El contenido de cadena de valor es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticItem> items = new ArrayList<>();
        int position = 0;
        position = addValueChainActivities(items, planId, command.supportActivities(), ValueChainActivityType.APOYO, position);
        position = addValueChainActivities(items, planId, command.primaryActivities(), ValueChainActivityType.PRIMARIA, position);
        position = addTextItems(
                items,
                planId,
                DiagnosticTool.VALUE_CHAIN,
                VALUE_CHAIN_OBSERVATION,
                List.of(contentMapper.clean(command.observations())),
                position
        );
        position = addTextItems(items, planId, DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_STRENGTH, command.strengths(), position);
        addTextItems(items, planId, DiagnosticTool.VALUE_CHAIN, VALUE_CHAIN_WEAKNESS, command.weaknesses(), position);

        return items;
    }

    public List<DiagnosticAssessment> normalizeValueChainAssessments(
            Long planId,
            UpdateValueChainCommand command,
            boolean requireComplete
    ) {
        if (command == null || command.assessments() == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El autodiagnostico de cadena de valor es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticAssessment> assessments = new ArrayList<>();
        Set<Integer> answeredQuestions = new HashSet<>();
        int customPosition = ValueChainQuestion.values().length;
        for (ValueChainAssessmentCommand assessment : command.assessments()) {
            if (assessment == null) {
                continue;
            }
            ValueChainQuestion question = valueChainQuestion(assessment);
            if (question != null) {
                if (!answeredQuestions.add(question.number())) {
                    throw new IllegalArgumentException("Cada pregunta de cadena de valor solo puede responderse una vez.");
                }
                assessments.add(DiagnosticAssessment.valueChain(
                        planId,
                        question,
                        assessment.score(),
                        contentMapper.clean(assessment.notes())
                ));
                continue;
            }

            if (requireComplete) {
                throw new IllegalArgumentException("El autodiagnostico de cadena de valor debe usar las 25 preguntas del cuestionario.");
            }

            String statement = contentMapper.clean(assessment.statement());
            if (statement.isBlank() || assessment.activity() == null) {
                continue;
            }
            assessments.add(DiagnosticAssessment.valueChain(
                    planId,
                    assessment.activity(),
                    statement,
                    assessment.score(),
                    contentMapper.clean(assessment.notes()),
                    customPosition++
            ));
        }
        assessments.sort(Comparator.comparingInt(DiagnosticAssessment::position));
        if (requireComplete && answeredQuestions.size() != ValueChainQuestion.values().length) {
            throw new IllegalArgumentException("Responda las 25 preguntas de cadena de valor antes de enviar a revision.");
        }
        return assessments;
    }

    public List<DiagnosticFinding> normalizeValueChainFindings(
            Long planId,
            UpdateValueChainCommand command,
            Long createdByUserId,
            boolean requireComplete
    ) {
        List<DiagnosticFinding> normalized = normalizeFindings(
                planId,
                new UpdateDiagnosticFindingsCommand(
                        DiagnosticTool.VALUE_CHAIN,
                        valueChainFindingCommands(command)
                ),
                createdByUserId
        );
        if (requireComplete) {
            boolean hasStrength = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.FORTALEZA);
            boolean hasWeakness = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.DEBILIDAD);
            if (!hasStrength || !hasWeakness) {
                throw new IllegalArgumentException("La cadena de valor debe incluir al menos una fortaleza y una debilidad.");
            }
        }
        return normalized;
    }

    public ValueChainSummary toValueChainSummary(
            Long planId,
            List<DiagnosticItem> items,
            List<DiagnosticAssessment> assessments,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Instant updatedAt = latestValueChainUpdatedAt(items, assessments, findings, fallbackUpdatedAt);
        List<DiagnosticAssessment> catalogAssessments = valueChainCatalogAssessments(assessments);
        int totalScore = catalogAssessments.stream().mapToInt(DiagnosticAssessment::score).sum();
        int maxScore = ValueChainQuestion.values().length * 4;
        int scorePercentage = maxScore == 0 ? 0 : Math.round((totalScore * 100f) / maxScore);
        int answeredQuestions = catalogAssessments.size();
        return new ValueChainSummary(
                planId,
                valueChainQuestionSummaries(catalogAssessments),
                valueChainDimensionSummaries(catalogAssessments),
                findings.stream()
                        .sorted(Comparator.comparingInt(DiagnosticFinding::position))
                        .map(this::toFindingSummary)
                        .toList(),
                activitySummaries(items, ValueChainActivityType.APOYO),
                activitySummaries(items, ValueChainActivityType.PRIMARIA),
                assessmentSummaries(assessments),
                firstDescription(items, VALUE_CHAIN_OBSERVATION),
                descriptions(items, VALUE_CHAIN_STRENGTH),
                descriptions(items, VALUE_CHAIN_WEAKNESS),
                totalScore,
                maxScore,
                scorePercentage,
                answeredQuestions,
                Math.max(0, 100 - scorePercentage),
                answeredQuestions == ValueChainQuestion.values().length,
                valueChainConclusion(scorePercentage, answeredQuestions == ValueChainQuestion.values().length),
                updatedAt
        );
    }

    public List<BcgPortfolioItem> normalizeBcgPortfolio(
            Long planId,
            UpdateBcgCommand command,
            boolean requireComplete
    ) {
        if (command == null || command.products() == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("La cartera BCG es obligatoria.");
            }
            return List.of();
        }

        double growthThreshold = marketGrowthThreshold(command);
        double shareThreshold = relativeMarketShareThreshold(command);
        List<BcgProductInput> inputs = new ArrayList<>();
        for (BcgPortfolioItemCommand product : command.products()) {
            if (product == null) {
                continue;
            }
            String name = contentMapper.clean(product.name());
            if (name.isBlank()) {
                continue;
            }
            if (product.annualSales() < 0 || product.relativeMarketShare() < 0) {
                throw new IllegalArgumentException("La cartera BCG no puede tener ventas o participacion negativas.");
            }
            List<Double> marketGrowthRates = numberValues(product.marketGrowthRates(), false);
            List<Double> sectorDemandValues = numberValues(product.sectorDemandValues(), true);
            List<BcgCompetitorSale> competitors = competitorSales(product.competitors());
            inputs.add(new BcgProductInput(
                    name,
                    contentMapper.clean(product.description()),
                    product.annualSales(),
                    BcgPortfolioItem.marketGrowthFromRates(marketGrowthRates, product.marketGrowthRate()),
                    BcgPortfolioItem.relativeMarketShareFromCompetitors(
                            product.annualSales(),
                            competitors,
                            product.relativeMarketShare()
                    ),
                    marketGrowthRates,
                    sectorDemandValues,
                    competitors,
                    contentMapper.clean(product.notes())
            ));
        }
        if (requireComplete && inputs.isEmpty()) {
            throw new IllegalArgumentException("La matriz BCG debe incluir al menos un producto o servicio.");
        }

        double totalSales = inputs.stream().mapToDouble(BcgProductInput::annualSales).sum();
        List<BcgPortfolioItem> products = new ArrayList<>();
        int position = 0;
        for (BcgProductInput input : inputs) {
            double salesPercentage = totalSales == 0 ? 0 : round((input.annualSales() * 100) / totalSales);
            products.add(BcgPortfolioItem.create(
                    planId,
                    input.name(),
                    input.description(),
                    input.annualSales(),
                    salesPercentage,
                    input.marketGrowthRate(),
                    input.relativeMarketShare(),
                    input.marketGrowthRates(),
                    input.sectorDemandValues(),
                    input.competitors(),
                    growthThreshold,
                    shareThreshold,
                    input.notes(),
                    position++
            ));
        }
        return products;
    }

    public List<DiagnosticItem> normalizeBcgItems(
            Long planId,
            UpdateBcgCommand command,
            boolean requireComplete
    ) {
        if (command == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El contenido BCG es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticItem> items = new ArrayList<>();
        int position = 0;
        position = addTextItems(
                items,
                planId,
                DiagnosticTool.BCG,
                BCG_OBSERVATION,
                List.of(contentMapper.clean(command.observations())),
                position
        );
        position = addTextItems(items, planId, DiagnosticTool.BCG, BCG_STRENGTH, command.strengths(), position);
        addTextItems(items, planId, DiagnosticTool.BCG, BCG_WEAKNESS, command.weaknesses(), position);
        return items;
    }

    public List<DiagnosticFinding> normalizeBcgFindings(
            Long planId,
            UpdateBcgCommand command,
            Long createdByUserId,
            boolean requireComplete
    ) {
        List<DiagnosticFinding> normalized = normalizeFindings(
                planId,
                new UpdateDiagnosticFindingsCommand(
                        DiagnosticTool.BCG,
                        bcgFindingCommands(command)
                ),
                createdByUserId
        );
        boolean hasInvalidCategory = normalized.stream()
                .anyMatch(finding -> finding.category() != SwotCategory.FORTALEZA
                        && finding.category() != SwotCategory.DEBILIDAD);
        if (hasInvalidCategory) {
            throw new IllegalArgumentException("Los hallazgos BCG solo pueden ser fortalezas o debilidades.");
        }
        if (requireComplete) {
            boolean hasStrength = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.FORTALEZA);
            boolean hasWeakness = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.DEBILIDAD);
            if (!hasStrength || !hasWeakness) {
                throw new IllegalArgumentException("BCG debe incluir al menos una fortaleza y una debilidad.");
            }
        }
        return normalized;
    }

    public List<DiagnosticFinding> normalizeFindings(
            Long planId,
            UpdateDiagnosticFindingsCommand command,
            Long createdByUserId
    ) {
        if (command == null || command.source() == null) {
            throw new IllegalArgumentException("La herramienta de origen de los hallazgos es obligatoria.");
        }
        assertFindingSource(command.source());
        if (command.findings() == null) {
            return List.of();
        }

        List<DiagnosticFinding> findings = new ArrayList<>();
        int position = 0;
        for (DiagnosticFindingCommand finding : command.findings()) {
            if (finding == null) {
                continue;
            }
            String description = contentMapper.clean(finding.description());
            if (description.isBlank()) {
                continue;
            }
            findings.add(DiagnosticFinding.create(
                    planId,
                    command.source(),
                    contentMapper.clean(finding.sourceDimension()),
                    finding.category(),
                    description,
                    contentMapper.clean(finding.evidence()),
                    contentMapper.clean(finding.impact()),
                    finding.priority(),
                    finding.selectedForFoda(),
                    createdByUserId,
                    position++
            ));
        }
        return findings;
    }

    public List<DiagnosticAssessment> normalizePestAssessments(
            Long planId,
            UpdatePestCommand command,
            boolean requireComplete
    ) {
        if (command == null || command.responses() == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El cuestionario PEST es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticAssessment> assessments = new ArrayList<>();
        Set<Integer> answeredQuestions = new HashSet<>();
        for (PestResponseCommand response : command.responses()) {
            if (response == null || response.score() == null) {
                continue;
            }
            PestQuestion question = PestQuestion.fromNumber(response.questionNumber());
            if (!answeredQuestions.add(question.number())) {
                throw new IllegalArgumentException("Cada pregunta PEST solo puede responderse una vez.");
            }
            assessments.add(DiagnosticAssessment.pest(planId, question, response.score()));
        }
        assessments.sort(Comparator.comparingInt(DiagnosticAssessment::position));
        if (requireComplete && answeredQuestions.size() != PestQuestion.values().length) {
            throw new IllegalArgumentException("Responda las 25 preguntas PEST antes de enviar a revision.");
        }
        return assessments;
    }

    public List<DiagnosticFinding> normalizePestFindings(
            Long planId,
            UpdatePestCommand command,
            Long createdByUserId,
            boolean requireComplete
    ) {
        List<DiagnosticFindingCommand> findings = command == null ? null : command.findings();
        List<DiagnosticFinding> normalized = normalizeFindings(
                planId,
                new UpdateDiagnosticFindingsCommand(DiagnosticTool.PEST, findings),
                createdByUserId
        );
        if (requireComplete) {
            boolean hasOpportunity = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.OPORTUNIDAD);
            boolean hasThreat = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.AMENAZA);
            if (!hasOpportunity || !hasThreat) {
                throw new IllegalArgumentException("El analisis PEST debe incluir al menos una oportunidad y una amenaza.");
            }
        }
        return normalized;
    }

    public PestSummary toPestSummary(
            Long planId,
            List<DiagnosticAssessment> assessments,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Map<Integer, DiagnosticAssessment> byQuestion = new HashMap<>();
        for (DiagnosticAssessment assessment : assessments) {
            byQuestion.put(assessment.position() + 1, assessment);
        }
        List<PestQuestionSummary> questions = java.util.Arrays.stream(PestQuestion.values())
                .map(question -> new PestQuestionSummary(
                        question.number(),
                        question.factor(),
                        question.statement(),
                        byQuestion.containsKey(question.number()) ? byQuestion.get(question.number()).score() : null
                ))
                .toList();
        List<PestFactorSummary> factors = java.util.Arrays.stream(PestFactor.values())
                .map(factor -> pestFactorSummary(factor, assessments))
                .toList();
        Instant latestFinding = findings.stream()
                .map(DiagnosticFinding::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        Instant updatedAt = assessments.stream()
                .map(DiagnosticAssessment::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(value -> value.isAfter(latestFinding))
                .orElse(latestFinding);
        return new PestSummary(
                planId,
                questions,
                factors,
                findings.stream()
                        .sorted(Comparator.comparingInt(DiagnosticFinding::position))
                        .map(this::toFindingSummary)
                        .toList(),
                assessments.size(),
                assessments.size() == PestQuestion.values().length,
                updatedAt
        );
    }

    private PestFactorSummary pestFactorSummary(PestFactor factor, List<DiagnosticAssessment> assessments) {
        List<DiagnosticAssessment> factorAssessments = assessments.stream()
                .filter(assessment -> factor.name().equals(assessment.category()))
                .toList();
        int score = factorAssessments.stream().mapToInt(DiagnosticAssessment::score).sum();
        int maxScore = 20;
        double impactLevel = round(score / (double) maxScore);
        return new PestFactorSummary(
                factor,
                factor.label(),
                factorAssessments.size(),
                score,
                maxScore,
                impactLevel,
                (int) Math.round(impactLevel * 100),
                factorAssessments.size() == 5 && impactLevel >= 0.7
        );
    }

    public List<DiagnosticAssessment> normalizePorterAssessments(
            Long planId,
            UpdatePorterCommand command,
            boolean requireComplete
    ) {
        if (command == null || command.responses() == null) {
            if (requireComplete) {
                throw new IllegalArgumentException("El cuestionario Porter es obligatorio.");
            }
            return List.of();
        }

        List<DiagnosticAssessment> assessments = new ArrayList<>();
        Set<Integer> answeredQuestions = new HashSet<>();
        for (PorterResponseCommand response : command.responses()) {
            if (response == null || response.score() == null) {
                continue;
            }
            PorterQuestion question = PorterQuestion.fromNumber(response.questionNumber());
            if (!answeredQuestions.add(question.number())) {
                throw new IllegalArgumentException("Cada pregunta Porter solo puede responderse una vez.");
            }
            assessments.add(DiagnosticAssessment.porter(planId, question, response.score()));
        }
        assessments.sort(Comparator.comparingInt(DiagnosticAssessment::position));
        if (requireComplete && answeredQuestions.size() != PorterQuestion.values().length) {
            throw new IllegalArgumentException("Responda las 25 preguntas Porter antes de enviar a revision.");
        }
        return assessments;
    }

    public List<DiagnosticFinding> normalizePorterFindings(
            Long planId,
            UpdatePorterCommand command,
            Long createdByUserId,
            boolean requireComplete
    ) {
        List<DiagnosticFindingCommand> findings = command == null ? null : command.findings();
        List<DiagnosticFinding> normalized = normalizeFindings(
                planId,
                new UpdateDiagnosticFindingsCommand(DiagnosticTool.PORTER, findings),
                createdByUserId
        );
        if (requireComplete) {
            boolean hasOpportunity = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.OPORTUNIDAD);
            boolean hasThreat = normalized.stream()
                    .anyMatch(finding -> finding.category() == SwotCategory.AMENAZA);
            if (!hasOpportunity || !hasThreat) {
                throw new IllegalArgumentException("El analisis Porter debe incluir al menos una oportunidad y una amenaza.");
            }
        }
        return normalized;
    }

    public PorterSummary toPorterSummary(
            Long planId,
            List<DiagnosticAssessment> assessments,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Map<Integer, DiagnosticAssessment> byQuestion = new HashMap<>();
        for (DiagnosticAssessment assessment : assessments) {
            byQuestion.put(assessment.position() + 1, assessment);
        }
        List<PorterQuestionSummary> questions = java.util.Arrays.stream(PorterQuestion.values())
                .map(question -> new PorterQuestionSummary(
                        question.number(),
                        question.force(),
                        question.statement(),
                        byQuestion.containsKey(question.number()) ? byQuestion.get(question.number()).score() : null
                ))
                .toList();
        List<PorterForceSummary> forces = java.util.Arrays.stream(PorterForce.values())
                .map(force -> porterForceSummary(force, assessments))
                .toList();
        int overallScore = assessments.stream().mapToInt(DiagnosticAssessment::score).sum();
        int maxOverallScore = PorterQuestion.values().length * 4;
        int pressurePercentage = Math.round((overallScore * 100f) / maxOverallScore);
        boolean complete = assessments.size() == PorterQuestion.values().length;
        Instant latestFinding = findings.stream()
                .map(DiagnosticFinding::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        Instant updatedAt = assessments.stream()
                .map(DiagnosticAssessment::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(value -> value.isAfter(latestFinding))
                .orElse(latestFinding);
        return new PorterSummary(
                planId,
                questions,
                forces,
                findings.stream()
                        .sorted(Comparator.comparingInt(DiagnosticFinding::position))
                        .map(this::toFindingSummary)
                        .toList(),
                assessments.size(),
                overallScore,
                maxOverallScore,
                pressurePercentage,
                porterConclusion(pressurePercentage, complete),
                complete,
                updatedAt
        );
    }

    private PorterForceSummary porterForceSummary(PorterForce force, List<DiagnosticAssessment> assessments) {
        List<DiagnosticAssessment> forceAssessments = assessments.stream()
                .filter(assessment -> force.name().equals(assessment.category()))
                .toList();
        int score = forceAssessments.stream().mapToInt(DiagnosticAssessment::score).sum();
        int maxScore = 20;
        double pressureLevel = round(score / (double) maxScore);
        return new PorterForceSummary(
                force,
                force.label(),
                forceAssessments.size(),
                score,
                maxScore,
                pressureLevel,
                (int) Math.round(pressureLevel * 100),
                forceAssessments.size() == 5 && pressureLevel >= 0.7
        );
    }

    private String porterConclusion(int pressurePercentage, boolean complete) {
        if (!complete) {
            return "Complete las 25 preguntas para obtener una conclusion competitiva.";
        }
        if (pressurePercentage < 25) {
            return "La presion competitiva del sector es baja y el entorno resulta favorable.";
        }
        if (pressurePercentage < 50) {
            return "La presion competitiva del sector es moderada y requiere seguimiento.";
        }
        if (pressurePercentage < 75) {
            return "La presion competitiva del sector es alta y exige respuestas estrategicas.";
        }
        return "La presion competitiva del sector es muy alta y limita significativamente su atractivo.";
    }

    private DiagnosticFindingSummary toFindingSummary(DiagnosticFinding finding) {
        return new DiagnosticFindingSummary(
                finding.id(),
                finding.source(),
                finding.sourceDimension(),
                finding.category(),
                finding.description(),
                finding.evidence(),
                finding.impact(),
                finding.priority(),
                finding.selectedForFoda(),
                finding.createdByUserId(),
                finding.position(),
                finding.createdAt(),
                finding.updatedAt()
        );
    }

    public BcgSummary toBcgSummary(
            Long planId,
            List<BcgPortfolioItem> products,
            List<DiagnosticItem> items,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Instant updatedAt = latestBcgUpdatedAt(items, products, findings, fallbackUpdatedAt);
        double totalSales = round(products.stream().mapToDouble(BcgPortfolioItem::annualSales).sum());
        double marketGrowthThreshold = products.stream()
                .findFirst()
                .map(BcgPortfolioItem::marketGrowthThreshold)
                .orElse(BcgPortfolioItem.DEFAULT_MARKET_GROWTH_THRESHOLD);
        double relativeMarketShareThreshold = products.stream()
                .findFirst()
                .map(BcgPortfolioItem::relativeMarketShareThreshold)
                .orElse(BcgPortfolioItem.DEFAULT_RELATIVE_MARKET_SHARE_THRESHOLD);
        return new BcgSummary(
                planId,
                products.stream()
                        .sorted(Comparator.comparingInt(BcgPortfolioItem::position))
                        .map(product -> new BcgPortfolioItemSummary(
                                product.id(),
                                product.name(),
                                product.description(),
                                product.annualSales(),
                                product.salesPercentage(),
                                product.marketGrowthRate(),
                                product.relativeMarketShare(),
                                product.marketGrowthRates(),
                                product.sectorDemandValues(),
                                product.competitors().stream()
                                        .map(competitor -> new BcgCompetitorSaleSummary(
                                                competitor.name(),
                                                competitor.sales()
                                        ))
                                        .toList(),
                                product.largestCompetitorSales(),
                                product.quadrant(),
                                product.strategicDecision(),
                                product.strategicDecision().label(),
                                product.notes(),
                                product.position()
                        ))
                        .toList(),
                findings.stream()
                        .sorted(Comparator.comparingInt(DiagnosticFinding::position))
                        .map(this::toFindingSummary)
                        .toList(),
                firstDescription(items, BCG_OBSERVATION),
                descriptions(items, BCG_STRENGTH),
                descriptions(items, BCG_WEAKNESS),
                marketGrowthThreshold,
                relativeMarketShareThreshold,
                totalSales,
                countQuadrant(products, BcgQuadrant.ESTRELLA),
                countQuadrant(products, BcgQuadrant.INCOGNITA),
                countQuadrant(products, BcgQuadrant.VACA),
                countQuadrant(products, BcgQuadrant.PERRO),
                updatedAt
        );
    }

    private int addSwotItems(
            List<DiagnosticItem> target,
            Long planId,
            SwotCategory category,
            List<SwotItemCommand> commands,
            int startPosition
    ) {
        int position = startPosition;
        if (commands == null) {
            return position;
        }
        for (SwotItemCommand command : commands) {
            if (command == null) {
                continue;
            }
            String description = contentMapper.clean(command.description());
            if (description.isBlank()) {
                continue;
            }
            target.add(DiagnosticItem.foda(
                    planId,
                    category,
                    description,
                    command.priority() == null ? DiagnosticPriority.MEDIA : command.priority(),
                    position++
            ));
        }
        return position;
    }

    private int addValueChainActivities(
            List<DiagnosticItem> target,
            Long planId,
            List<ValueChainActivityCommand> commands,
            ValueChainActivityType expectedType,
            int startPosition
    ) {
        int position = startPosition;
        if (commands == null) {
            return position;
        }
        for (ValueChainActivityCommand command : commands) {
            if (command == null || command.activity() == null || command.activity().type() != expectedType) {
                continue;
            }
            String description = contentMapper.clean(command.description());
            if (description.isBlank()) {
                continue;
            }
            target.add(DiagnosticItem.valueChain(
                    planId,
                    command.activity().name(),
                    description,
                    command.priority() == null ? DiagnosticPriority.MEDIA : command.priority(),
                    position++
            ));
        }
        return position;
    }

    private int addTextItems(
            List<DiagnosticItem> target,
            Long planId,
            DiagnosticTool tool,
            String category,
            List<String> values,
            int startPosition
    ) {
        int position = startPosition;
        if (values == null) {
            return position;
        }
        for (String value : values) {
            String description = contentMapper.clean(value);
            if (description.isBlank()) {
                continue;
            }
            target.add(DiagnosticItem.diagnostic(
                    planId,
                    tool,
                    category,
                    description,
                    DiagnosticPriority.MEDIA,
                    position++
            ));
        }
        return position;
    }

    private List<SwotItemSummary> summaries(List<DiagnosticItem> items, SwotCategory category) {
        return items.stream()
                .filter(item -> category.name().equals(item.category()))
                .sorted(Comparator.comparingInt(DiagnosticItem::position))
                .map(item -> new SwotItemSummary(
                        item.id(),
                        category,
                        item.description(),
                        item.priority(),
                        item.position()
                ))
                .toList();
    }

    private List<ValueChainActivitySummary> activitySummaries(
            List<DiagnosticItem> items,
            ValueChainActivityType type
    ) {
        return items.stream()
                .filter(item -> valueChainActivity(item.category()) != null)
                .map(item -> new ActivityItem(item, valueChainActivity(item.category())))
                .filter(item -> item.activity().type() == type)
                .sorted(Comparator.comparingInt(item -> item.item().position()))
                .map(item -> new ValueChainActivitySummary(
                        item.item().id(),
                        item.activity(),
                        item.activity().type(),
                        item.item().description(),
                        item.item().priority(),
                        item.item().position()
                ))
                .toList();
    }

    private List<ValueChainAssessmentSummary> assessmentSummaries(List<DiagnosticAssessment> assessments) {
        return assessments.stream()
                .sorted(Comparator.comparingInt(DiagnosticAssessment::position))
                .map(assessment -> new ValueChainAssessmentSummary(
                        assessment.id(),
                        valueChainQuestionNumber(assessment),
                        valueChainActivity(assessment.category()),
                        assessment.statement(),
                        assessment.score(),
                        assessment.notes(),
                        assessment.position()
                ))
                .toList();
    }

    private List<ValueChainQuestionSummary> valueChainQuestionSummaries(List<DiagnosticAssessment> assessments) {
        Map<Integer, DiagnosticAssessment> byQuestion = new HashMap<>();
        for (DiagnosticAssessment assessment : assessments) {
            ValueChainQuestion question = ValueChainQuestion.fromStatement(assessment.statement());
            if (question != null) {
                byQuestion.put(question.number(), assessment);
            }
        }
        return java.util.Arrays.stream(ValueChainQuestion.values())
                .map(question -> new ValueChainQuestionSummary(
                        question.number(),
                        question.activity(),
                        question.dimensions(),
                        question.statement(),
                        byQuestion.containsKey(question.number()) ? byQuestion.get(question.number()).score() : null
                ))
                .toList();
    }

    private List<ValueChainDimensionSummary> valueChainDimensionSummaries(List<DiagnosticAssessment> assessments) {
        Map<Integer, DiagnosticAssessment> byQuestion = new HashMap<>();
        for (DiagnosticAssessment assessment : assessments) {
            ValueChainQuestion question = ValueChainQuestion.fromStatement(assessment.statement());
            if (question != null) {
                byQuestion.put(question.number(), assessment);
            }
        }
        return java.util.Arrays.stream(ValueChainDimension.values())
                .map(dimension -> valueChainDimensionSummary(dimension, byQuestion))
                .toList();
    }

    private ValueChainDimensionSummary valueChainDimensionSummary(
            ValueChainDimension dimension,
            Map<Integer, DiagnosticAssessment> byQuestion
    ) {
        int maxScore = 0;
        int score = 0;
        int answered = 0;
        for (ValueChainQuestion question : ValueChainQuestion.values()) {
            if (!question.dimensions().contains(dimension)) {
                continue;
            }
            maxScore += 4;
            DiagnosticAssessment assessment = byQuestion.get(question.number());
            if (assessment != null) {
                answered++;
                score += assessment.score();
            }
        }
        int maturityPercentage = maxScore == 0 ? 0 : Math.round((score * 100f) / maxScore);
        return new ValueChainDimensionSummary(
                dimension,
                dimension.code(),
                dimension.label(),
                answered,
                score,
                maxScore,
                maturityPercentage,
                Math.max(0, 100 - maturityPercentage)
        );
    }

    private List<DiagnosticAssessment> valueChainCatalogAssessments(List<DiagnosticAssessment> assessments) {
        return assessments.stream()
                .filter(assessment -> ValueChainQuestion.fromStatement(assessment.statement()) != null)
                .toList();
    }

    private ValueChainQuestion valueChainQuestion(ValueChainAssessmentCommand assessment) {
        if (assessment.questionNumber() != null) {
            return ValueChainQuestion.fromNumber(assessment.questionNumber());
        }
        return ValueChainQuestion.fromStatement(contentMapper.clean(assessment.statement()));
    }

    private Integer valueChainQuestionNumber(DiagnosticAssessment assessment) {
        ValueChainQuestion question = ValueChainQuestion.fromStatement(assessment.statement());
        return question == null ? null : question.number();
    }

    private List<DiagnosticFindingCommand> valueChainFindingCommands(UpdateValueChainCommand command) {
        List<DiagnosticFindingCommand> findings = command == null ? null : command.findings();
        if (findings != null && !findings.isEmpty()) {
            return findings;
        }
        List<DiagnosticFindingCommand> fallback = new ArrayList<>();
        if (command != null && command.strengths() != null) {
            for (String strength : command.strengths()) {
                fallback.add(new DiagnosticFindingCommand(
                        ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL.name(),
                        SwotCategory.FORTALEZA,
                        strength,
                        "",
                        "",
                        DiagnosticPriority.MEDIA,
                        true
                ));
            }
        }
        if (command != null && command.weaknesses() != null) {
            for (String weakness : command.weaknesses()) {
                fallback.add(new DiagnosticFindingCommand(
                        ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL.name(),
                        SwotCategory.DEBILIDAD,
                        weakness,
                        "",
                        "",
                        DiagnosticPriority.MEDIA,
                        true
                ));
            }
        }
        return fallback;
    }

    private List<DiagnosticFindingCommand> bcgFindingCommands(UpdateBcgCommand command) {
        List<DiagnosticFindingCommand> findings = command == null ? null : command.findings();
        if (findings != null && !findings.isEmpty()) {
            return findings;
        }
        List<DiagnosticFindingCommand> fallback = new ArrayList<>();
        if (command != null && command.strengths() != null) {
            for (String strength : command.strengths()) {
                fallback.add(new DiagnosticFindingCommand(
                        "BCG",
                        SwotCategory.FORTALEZA,
                        strength,
                        "",
                        "",
                        DiagnosticPriority.MEDIA,
                        true
                ));
            }
        }
        if (command != null && command.weaknesses() != null) {
            for (String weakness : command.weaknesses()) {
                fallback.add(new DiagnosticFindingCommand(
                        "BCG",
                        SwotCategory.DEBILIDAD,
                        weakness,
                        "",
                        "",
                        DiagnosticPriority.MEDIA,
                        true
                ));
            }
        }
        return fallback;
    }

    private String valueChainConclusion(int scorePercentage, boolean complete) {
        if (!complete) {
            return "Complete las 25 preguntas para obtener el potencial de mejora interno.";
        }
        int improvement = Math.max(0, 100 - scorePercentage);
        if (improvement < 25) {
            return "La cadena de valor muestra alta madurez interna y bajo potencial de mejora pendiente.";
        }
        if (improvement < 50) {
            return "La cadena de valor tiene madurez intermedia y oportunidades puntuales de mejora.";
        }
        if (improvement < 75) {
            return "La cadena de valor presenta brechas internas importantes que conviene priorizar.";
        }
        return "La cadena de valor evidencia alto potencial de mejora y requiere intervenciones estructuradas.";
    }

    private List<String> descriptions(List<DiagnosticItem> items, String category) {
        return items.stream()
                .filter(item -> category.equals(item.category()))
                .sorted(Comparator.comparingInt(DiagnosticItem::position))
                .map(DiagnosticItem::description)
                .toList();
    }

    private String firstDescription(List<DiagnosticItem> items, String category) {
        return descriptions(items, category).stream().findFirst().orElse("");
    }

    private void assertHasCategory(List<DiagnosticItem> items, SwotCategory category) {
        boolean hasCategory = items.stream().anyMatch(item -> category.name().equals(item.category()));
        if (!hasCategory) {
            throw new IllegalArgumentException("El FODA debe incluir al menos un item en " + category.name().toLowerCase() + ".");
        }
    }

    private void assertFindingSource(DiagnosticTool source) {
        if (source != DiagnosticTool.PEST
                && source != DiagnosticTool.PORTER
                && source != DiagnosticTool.VALUE_CHAIN
                && source != DiagnosticTool.BCG) {
            throw new IllegalArgumentException("Los hallazgos deben provenir de PEST, Porter, cadena de valor o BCG.");
        }
    }

    private int countQuadrant(List<BcgPortfolioItem> products, BcgQuadrant quadrant) {
        return (int) products.stream()
                .filter(product -> product.quadrant() == quadrant)
                .count();
    }

    private double marketGrowthThreshold(UpdateBcgCommand command) {
        return command.marketGrowthThreshold() == null
                ? BcgPortfolioItem.DEFAULT_MARKET_GROWTH_THRESHOLD
                : command.marketGrowthThreshold();
    }

    private double relativeMarketShareThreshold(UpdateBcgCommand command) {
        double threshold = command.relativeMarketShareThreshold() == null
                ? BcgPortfolioItem.DEFAULT_RELATIVE_MARKET_SHARE_THRESHOLD
                : command.relativeMarketShareThreshold();
        if (threshold <= 0) {
            throw new IllegalArgumentException("El umbral de participacion relativa BCG debe ser mayor a cero.");
        }
        return threshold;
    }

    private List<Double> numberValues(List<Double> values, boolean requireNonNegative) {
        if (values == null) {
            return List.of();
        }
        List<Double> numbers = new ArrayList<>();
        for (Double value : values) {
            if (value == null || !Double.isFinite(value)) {
                continue;
            }
            if (requireNonNegative && value < 0) {
                throw new IllegalArgumentException("Los valores BCG no pueden ser negativos.");
            }
            numbers.add(round(value));
        }
        return numbers;
    }

    private List<BcgCompetitorSale> competitorSales(List<BcgCompetitorSaleCommand> competitors) {
        if (competitors == null) {
            return List.of();
        }
        List<BcgCompetitorSale> sales = new ArrayList<>();
        int index = 1;
        for (BcgCompetitorSaleCommand competitor : competitors) {
            if (competitor == null) {
                continue;
            }
            if (competitor.sales() < 0) {
                throw new IllegalArgumentException("Las ventas del competidor BCG no pueden ser negativas.");
            }
            String name = contentMapper.clean(competitor.name());
            if (name.isBlank()) {
                name = "Competidor " + index;
            }
            sales.add(new BcgCompetitorSale(name, round(competitor.sales())));
            index++;
            if (sales.size() == 9) {
                break;
            }
        }
        return sales;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private Instant latestUpdatedAt(
            List<DiagnosticItem> items,
            List<DiagnosticAssessment> assessments,
            Instant fallbackUpdatedAt
    ) {
        Instant latestItem = items.stream()
                .map(DiagnosticItem::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        return assessments.stream()
                .map(DiagnosticAssessment::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(instant -> instant.isAfter(latestItem))
                .orElse(latestItem);
    }

    private Instant latestValueChainUpdatedAt(
            List<DiagnosticItem> items,
            List<DiagnosticAssessment> assessments,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Instant latestAssessment = latestUpdatedAt(items, assessments, fallbackUpdatedAt);
        return findings.stream()
                .map(DiagnosticFinding::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(instant -> instant.isAfter(latestAssessment))
                .orElse(latestAssessment);
    }

    private Instant latestBcgUpdatedAt(
            List<DiagnosticItem> items,
            List<BcgPortfolioItem> products,
            List<DiagnosticFinding> findings,
            Instant fallbackUpdatedAt
    ) {
        Instant latestItem = items.stream()
                .map(DiagnosticItem::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        Instant latestProduct = products.stream()
                .map(BcgPortfolioItem::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(instant -> instant.isAfter(latestItem))
                .orElse(latestItem);
        return findings.stream()
                .map(DiagnosticFinding::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(instant -> instant.isAfter(latestProduct))
                .orElse(latestProduct);
    }

    private ValueChainActivity valueChainActivity(String value) {
        try {
            return ValueChainActivity.valueOf(value);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private record ActivityItem(DiagnosticItem item, ValueChainActivity activity) {
    }

    private record BcgProductInput(
            String name,
            String description,
            double annualSales,
            double marketGrowthRate,
            double relativeMarketShare,
            List<Double> marketGrowthRates,
            List<Double> sectorDemandValues,
            List<BcgCompetitorSale> competitors,
            String notes
    ) {
    }
}
