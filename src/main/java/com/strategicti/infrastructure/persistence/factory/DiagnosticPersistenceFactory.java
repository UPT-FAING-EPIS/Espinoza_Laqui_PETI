package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.infrastructure.persistence.entity.BcgPortfolioItemJpaEntity;
import com.strategicti.infrastructure.persistence.entity.DiagnosticAssessmentJpaEntity;
import com.strategicti.infrastructure.persistence.entity.DiagnosticItemJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class DiagnosticPersistenceFactory {
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
                entity.getMarketGrowthThreshold(),
                entity.getRelativeMarketShareThreshold(),
                entity.getQuadrant(),
                entity.getStrategicDecision(),
                emptyIfNull(entity.getNotes()),
                entity.getPosition(),
                entity.getUpdatedAt()
        );
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
