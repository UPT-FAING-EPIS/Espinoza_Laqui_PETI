package com.strategicti.application.ports.out;

import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticTool;

import java.util.List;

public interface IDiagnosticRepositoryPort {
    List<DiagnosticItem> findItems(Long planId, DiagnosticTool tool);

    List<DiagnosticItem> replaceItems(Long planId, DiagnosticTool tool, List<DiagnosticItem> items);

    List<DiagnosticAssessment> findAssessments(Long planId, DiagnosticTool tool);

    List<DiagnosticAssessment> replaceAssessments(
            Long planId,
            DiagnosticTool tool,
            List<DiagnosticAssessment> assessments
    );

    List<BcgPortfolioItem> findBcgPortfolioItems(Long planId);

    List<BcgPortfolioItem> replaceBcgPortfolioItems(Long planId, List<BcgPortfolioItem> products);
}
