package com.strategicti.application.service;

import com.strategicti.application.usecase.BcgPortfolioItemCommand;
import com.strategicti.application.usecase.BcgPortfolioItemSummary;
import com.strategicti.application.usecase.BcgSummary;
import com.strategicti.application.usecase.SwotItemCommand;
import com.strategicti.application.usecase.SwotItemSummary;
import com.strategicti.application.usecase.SwotSummary;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.application.usecase.ValueChainActivityCommand;
import com.strategicti.application.usecase.ValueChainActivitySummary;
import com.strategicti.application.usecase.ValueChainAssessmentCommand;
import com.strategicti.application.usecase.ValueChainAssessmentSummary;
import com.strategicti.application.usecase.ValueChainSummary;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.SwotCategory;
import com.strategicti.domain.model.ValueChainActivity;
import com.strategicti.domain.model.ValueChainActivityType;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

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

        if (requireComplete) {
            assertHasValueChainType(items, ValueChainActivityType.APOYO);
            assertHasValueChainType(items, ValueChainActivityType.PRIMARIA);
        }
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
        int position = 0;
        for (ValueChainAssessmentCommand assessment : command.assessments()) {
            if (assessment == null || assessment.activity() == null) {
                continue;
            }
            String statement = contentMapper.clean(assessment.statement());
            if (statement.isBlank()) {
                continue;
            }
            assessments.add(DiagnosticAssessment.valueChain(
                    planId,
                    assessment.activity(),
                    statement,
                    assessment.score(),
                    contentMapper.clean(assessment.notes()),
                    position++
            ));
        }
        if (requireComplete && assessments.isEmpty()) {
            throw new IllegalArgumentException("El autodiagnostico de cadena de valor debe incluir al menos una valoracion.");
        }
        return assessments;
    }

    public ValueChainSummary toValueChainSummary(
            Long planId,
            List<DiagnosticItem> items,
            List<DiagnosticAssessment> assessments,
            Instant fallbackUpdatedAt
    ) {
        Instant updatedAt = latestUpdatedAt(items, assessments, fallbackUpdatedAt);
        int totalScore = assessments.stream().mapToInt(DiagnosticAssessment::score).sum();
        int maxScore = assessments.size() * 4;
        int scorePercentage = maxScore == 0 ? 0 : Math.round((totalScore * 100f) / maxScore);
        return new ValueChainSummary(
                planId,
                activitySummaries(items, ValueChainActivityType.APOYO),
                activitySummaries(items, ValueChainActivityType.PRIMARIA),
                assessmentSummaries(assessments),
                firstDescription(items, VALUE_CHAIN_OBSERVATION),
                descriptions(items, VALUE_CHAIN_STRENGTH),
                descriptions(items, VALUE_CHAIN_WEAKNESS),
                totalScore,
                maxScore,
                scorePercentage,
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
            inputs.add(new BcgProductInput(
                    name,
                    contentMapper.clean(product.description()),
                    product.annualSales(),
                    product.marketGrowthRate(),
                    product.relativeMarketShare(),
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

    public BcgSummary toBcgSummary(
            Long planId,
            List<BcgPortfolioItem> products,
            List<DiagnosticItem> items,
            Instant fallbackUpdatedAt
    ) {
        Instant updatedAt = latestBcgUpdatedAt(items, products, fallbackUpdatedAt);
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
                                product.quadrant(),
                                product.strategicDecision(),
                                product.strategicDecision().label(),
                                product.notes(),
                                product.position()
                        ))
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
                        valueChainActivity(assessment.category()),
                        assessment.statement(),
                        assessment.score(),
                        assessment.notes(),
                        assessment.position()
                ))
                .toList();
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

    private void assertHasValueChainType(List<DiagnosticItem> items, ValueChainActivityType type) {
        boolean hasType = items.stream()
                .map(item -> valueChainActivity(item.category()))
                .anyMatch(activity -> activity != null && activity.type() == type);
        if (!hasType) {
            throw new IllegalArgumentException("La cadena de valor debe incluir al menos una actividad " + type.name().toLowerCase() + ".");
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

    private Instant latestBcgUpdatedAt(
            List<DiagnosticItem> items,
            List<BcgPortfolioItem> products,
            Instant fallbackUpdatedAt
    ) {
        Instant latestItem = items.stream()
                .map(DiagnosticItem::updatedAt)
                .max(Comparator.naturalOrder())
                .orElse(fallbackUpdatedAt);
        return products.stream()
                .map(BcgPortfolioItem::updatedAt)
                .max(Comparator.naturalOrder())
                .filter(instant -> instant.isAfter(latestItem))
                .orElse(latestItem);
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
            String notes
    ) {
    }
}
