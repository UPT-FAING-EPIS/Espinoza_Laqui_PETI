package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.BcgCompetitorSale;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticFinding;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.infrastructure.persistence.entity.BcgPortfolioItemJpaEntity;
import com.strategicti.infrastructure.persistence.entity.DiagnosticAssessmentJpaEntity;
import com.strategicti.infrastructure.persistence.entity.DiagnosticFindingJpaEntity;
import com.strategicti.infrastructure.persistence.entity.DiagnosticItemJpaEntity;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

@Component
public class DiagnosticPersistenceFactory {
    private final ObjectMapper objectMapper;

    public DiagnosticPersistenceFactory(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public DiagnosticItemJpaEntity toEntity(DiagnosticItem item) {
        DiagnosticItemJpaEntity entity = new DiagnosticItemJpaEntity();
        entity.setPlanId(item.planId());
        entity.setTool(item.tool());
        entity.setCategory(item.category());
        entity.setDescription(item.description());
        entity.setPriority(item.priority());
        entity.setPosition(item.position());
        entity.setUpdatedAt(item.updatedAt());
        return entity;
    }

    public DiagnosticItem toDomain(DiagnosticItemJpaEntity entity) {
        return new DiagnosticItem(
                entity.getId(),
                entity.getPlanId(),
                entity.getTool(),
                entity.getCategory(),
                entity.getDescription(),
                entity.getPriority(),
                entity.getPosition(),
                entity.getUpdatedAt()
        );
    }

    public DiagnosticAssessmentJpaEntity toEntity(DiagnosticAssessment assessment) {
        DiagnosticAssessmentJpaEntity entity = new DiagnosticAssessmentJpaEntity();
        entity.setPlanId(assessment.planId());
        entity.setTool(assessment.tool());
        entity.setCategory(assessment.category());
        entity.setStatement(assessment.statement());
        entity.setScore(assessment.score());
        entity.setNotes(assessment.notes());
        entity.setPosition(assessment.position());
        entity.setUpdatedAt(assessment.updatedAt());
        return entity;
    }

    public DiagnosticAssessment toDomain(DiagnosticAssessmentJpaEntity entity) {
        return new DiagnosticAssessment(
                entity.getId(),
                entity.getPlanId(),
                entity.getTool(),
                entity.getCategory(),
                entity.getStatement(),
                entity.getScore(),
                emptyIfNull(entity.getNotes()),
                entity.getPosition(),
                entity.getUpdatedAt()
        );
    }

    public BcgPortfolioItemJpaEntity toEntity(BcgPortfolioItem product) {
        BcgPortfolioItemJpaEntity entity = new BcgPortfolioItemJpaEntity();
        entity.setPlanId(product.planId());
        entity.setName(product.name());
        entity.setDescription(product.description());
        entity.setAnnualSales(product.annualSales());
        entity.setSalesPercentage(product.salesPercentage());
        entity.setMarketGrowthRate(product.marketGrowthRate());
        entity.setRelativeMarketShare(product.relativeMarketShare());
        entity.setMarketGrowthRatesJson(writeJson(product.marketGrowthRates()));
        entity.setSectorDemandValuesJson(writeJson(product.sectorDemandValues()));
        entity.setCompetitorsJson(writeJson(product.competitors()));
        entity.setLargestCompetitorSales(product.largestCompetitorSales());
        entity.setMarketGrowthThreshold(product.marketGrowthThreshold());
        entity.setRelativeMarketShareThreshold(product.relativeMarketShareThreshold());
        entity.setQuadrant(product.quadrant());
        entity.setStrategicDecision(product.strategicDecision());
        entity.setNotes(product.notes());
        entity.setPosition(product.position());
        entity.setUpdatedAt(product.updatedAt());
        return entity;
    }

    public BcgPortfolioItem toDomain(BcgPortfolioItemJpaEntity entity) {
        return new BcgPortfolioItem(
                entity.getId(),
                entity.getPlanId(),
                entity.getName(),
                emptyIfNull(entity.getDescription()),
                entity.getAnnualSales(),
                entity.getSalesPercentage(),
                entity.getMarketGrowthRate(),
                entity.getRelativeMarketShare(),
                readNumbers(entity.getMarketGrowthRatesJson()),
                readNumbers(entity.getSectorDemandValuesJson()),
                readCompetitors(entity.getCompetitorsJson()),
                entity.getLargestCompetitorSales(),
                entity.getMarketGrowthThreshold(),
                entity.getRelativeMarketShareThreshold(),
                entity.getQuadrant(),
                entity.getStrategicDecision(),
                emptyIfNull(entity.getNotes()),
                entity.getPosition(),
                entity.getUpdatedAt()
        );
    }

    public DiagnosticFindingJpaEntity toEntity(DiagnosticFinding finding) {
        DiagnosticFindingJpaEntity entity = new DiagnosticFindingJpaEntity();
        entity.setPlanId(finding.planId());
        entity.setSource(finding.source());
        entity.setSourceDimension(finding.sourceDimension());
        entity.setCategory(finding.category());
        entity.setDescription(finding.description());
        entity.setEvidence(finding.evidence());
        entity.setImpact(finding.impact());
        entity.setPriority(finding.priority());
        entity.setSelectedForFoda(finding.selectedForFoda());
        entity.setCreatedByUserId(finding.createdByUserId());
        entity.setPosition(finding.position());
        entity.setCreatedAt(finding.createdAt());
        entity.setUpdatedAt(finding.updatedAt());
        return entity;
    }

    public DiagnosticFinding toDomain(DiagnosticFindingJpaEntity entity) {
        return new DiagnosticFinding(
                entity.getId(),
                entity.getPlanId(),
                entity.getSource(),
                emptyIfNull(entity.getSourceDimension()),
                entity.getCategory(),
                entity.getDescription(),
                emptyIfNull(entity.getEvidence()),
                emptyIfNull(entity.getImpact()),
                entity.getPriority(),
                entity.isSelectedForFoda(),
                entity.getCreatedByUserId(),
                entity.getPosition(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JacksonException exception) {
            return "[]";
        }
    }

    private List<Double> readNumbers(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            Double[] values = objectMapper.readValue(json, Double[].class);
            return Arrays.stream(values)
                    .filter(value -> value != null && Double.isFinite(value))
                    .toList();
        } catch (JacksonException exception) {
            return List.of();
        }
    }

    private List<BcgCompetitorSale> readCompetitors(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            BcgCompetitorSale[] values = objectMapper.readValue(json, BcgCompetitorSale[].class);
            return Arrays.stream(values)
                    .filter(competitor -> competitor != null)
                    .toList();
        } catch (JacksonException exception) {
            return List.of();
        }
    }
}
