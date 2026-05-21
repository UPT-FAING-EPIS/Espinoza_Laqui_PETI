package com.strategicti.infrastructure.persistence.adapter;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.infrastructure.persistence.factory.DiagnosticPersistenceFactory;
import com.strategicti.infrastructure.persistence.repository.SpringDataBcgPortfolioItemRepository;
import com.strategicti.infrastructure.persistence.repository.SpringDataDiagnosticAssessmentRepository;
import com.strategicti.infrastructure.persistence.repository.SpringDataDiagnosticItemRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public class DiagnosticPersistenceAdapter implements IDiagnosticRepositoryPort {
    private final SpringDataDiagnosticItemRepository itemRepository;
    private final SpringDataDiagnosticAssessmentRepository assessmentRepository;
    private final SpringDataBcgPortfolioItemRepository bcgPortfolioItemRepository;
    private final DiagnosticPersistenceFactory factory;

    public DiagnosticPersistenceAdapter(
            SpringDataDiagnosticItemRepository itemRepository,
            SpringDataDiagnosticAssessmentRepository assessmentRepository,
            SpringDataBcgPortfolioItemRepository bcgPortfolioItemRepository,
            DiagnosticPersistenceFactory factory
    ) {
        this.itemRepository = itemRepository;
        this.assessmentRepository = assessmentRepository;
        this.bcgPortfolioItemRepository = bcgPortfolioItemRepository;
        this.factory = factory;
    }

    @Override
    public List<DiagnosticItem> findItems(Long planId, DiagnosticTool tool) {
        return itemRepository.findByPlanIdAndToolOrderByPositionAsc(planId, tool).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<DiagnosticItem> replaceItems(Long planId, DiagnosticTool tool, List<DiagnosticItem> items) {
        itemRepository.deleteByPlanIdAndTool(planId, tool);
        return itemRepository.saveAll(items.stream().map(factory::toEntity).toList()).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public List<DiagnosticAssessment> findAssessments(Long planId, DiagnosticTool tool) {
        return assessmentRepository.findByPlanIdAndToolOrderByPositionAsc(planId, tool).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<DiagnosticAssessment> replaceAssessments(
            Long planId,
            DiagnosticTool tool,
            List<DiagnosticAssessment> assessments
    ) {
        assessmentRepository.deleteByPlanIdAndTool(planId, tool);
        return assessmentRepository.saveAll(assessments.stream().map(factory::toEntity).toList()).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    public List<BcgPortfolioItem> findBcgPortfolioItems(Long planId) {
        return bcgPortfolioItemRepository.findByPlanIdOrderByPositionAsc(planId).stream()
                .map(factory::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public List<BcgPortfolioItem> replaceBcgPortfolioItems(Long planId, List<BcgPortfolioItem> products) {
        bcgPortfolioItemRepository.deleteByPlanId(planId);
        return bcgPortfolioItemRepository.saveAll(products.stream().map(factory::toEntity).toList()).stream()
                .map(factory::toDomain)
                .toList();
    }
}
