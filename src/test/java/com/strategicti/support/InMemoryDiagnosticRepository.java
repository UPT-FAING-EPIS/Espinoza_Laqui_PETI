package com.strategicti.support;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticTool;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class InMemoryDiagnosticRepository implements IDiagnosticRepositoryPort {
    private final Map<Long, DiagnosticItem> items = new LinkedHashMap<>();
    private final Map<Long, DiagnosticAssessment> assessments = new LinkedHashMap<>();
    private final Map<Long, BcgPortfolioItem> bcgPortfolioItems = new LinkedHashMap<>();
    private long itemSequence;
    private long assessmentSequence;
    private long bcgPortfolioSequence;

    @Override
    public List<DiagnosticItem> findItems(Long planId, DiagnosticTool tool) {
        return items.values().stream()
                .filter(item -> item.planId().equals(planId) && item.tool() == tool)
                .sorted(Comparator.comparingInt(DiagnosticItem::position))
                .toList();
    }

    @Override
    public List<DiagnosticItem> replaceItems(Long planId, DiagnosticTool tool, List<DiagnosticItem> nextItems) {
        items.entrySet().removeIf(entry -> entry.getValue().planId().equals(planId) && entry.getValue().tool() == tool);
        for (DiagnosticItem item : nextItems) {
            Long id = item.id() == null ? ++itemSequence : item.id();
            items.put(id, new DiagnosticItem(
                    id,
                    item.planId(),
                    item.tool(),
                    item.category(),
                    item.description(),
                    item.priority(),
                    item.position(),
                    item.updatedAt()
            ));
        }
        return findItems(planId, tool);
    }

    @Override
    public List<DiagnosticAssessment> findAssessments(Long planId, DiagnosticTool tool) {
        return assessments.values().stream()
                .filter(assessment -> assessment.planId().equals(planId) && assessment.tool() == tool)
                .sorted(Comparator.comparingInt(DiagnosticAssessment::position))
                .toList();
    }

    @Override
    public List<DiagnosticAssessment> replaceAssessments(
            Long planId,
            DiagnosticTool tool,
            List<DiagnosticAssessment> nextAssessments
    ) {
        assessments.entrySet().removeIf(entry -> entry.getValue().planId().equals(planId)
                && entry.getValue().tool() == tool);
        for (DiagnosticAssessment assessment : nextAssessments) {
            Long id = assessment.id() == null ? ++assessmentSequence : assessment.id();
            assessments.put(id, new DiagnosticAssessment(
                    id,
                    assessment.planId(),
                    assessment.tool(),
                    assessment.category(),
                    assessment.statement(),
                    assessment.score(),
                    assessment.notes(),
                    assessment.position(),
                    assessment.updatedAt()
            ));
        }
        return findAssessments(planId, tool);
    }

    @Override
    public List<BcgPortfolioItem> findBcgPortfolioItems(Long planId) {
        return bcgPortfolioItems.values().stream()
                .filter(product -> product.planId().equals(planId))
                .sorted(Comparator.comparingInt(BcgPortfolioItem::position))
                .toList();
    }

    @Override
    public List<BcgPortfolioItem> replaceBcgPortfolioItems(Long planId, List<BcgPortfolioItem> nextProducts) {
        bcgPortfolioItems.entrySet().removeIf(entry -> entry.getValue().planId().equals(planId));
        for (BcgPortfolioItem product : nextProducts) {
            Long id = product.id() == null ? ++bcgPortfolioSequence : product.id();
            bcgPortfolioItems.put(id, new BcgPortfolioItem(
                    id,
                    product.planId(),
                    product.name(),
                    product.description(),
                    product.annualSales(),
                    product.salesPercentage(),
                    product.marketGrowthRate(),
                    product.relativeMarketShare(),
                    product.marketGrowthThreshold(),
                    product.relativeMarketShareThreshold(),
                    product.quadrant(),
                    product.strategicDecision(),
                    product.notes(),
                    product.position(),
                    product.updatedAt()
            ));
        }
        return findBcgPortfolioItems(planId);
    }
}
