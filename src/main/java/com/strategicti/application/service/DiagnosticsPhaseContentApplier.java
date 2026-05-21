package com.strategicti.application.service;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Component
public class DiagnosticsPhaseContentApplier implements PhaseContentApplier {
    private final ObjectMapper objectMapper;
    private final IDiagnosticRepositoryPort diagnosticRepository;
    private final DiagnosticContentMapper diagnosticContentMapper;

    public DiagnosticsPhaseContentApplier(
            ObjectMapper objectMapper,
            IDiagnosticRepositoryPort diagnosticRepository,
            DiagnosticContentMapper diagnosticContentMapper
    ) {
        this.objectMapper = objectMapper;
        this.diagnosticRepository = diagnosticRepository;
        this.diagnosticContentMapper = diagnosticContentMapper;
    }

    @Override
    public PetiPhase phase() {
        return PetiPhase.DIAGNOSTICS;
    }

    @Override
    public StrategicPlan apply(StrategicPlan plan, String contentJson) {
        try {
            DiagnosticsPhaseContent content = objectMapper.readValue(contentJson, DiagnosticsPhaseContent.class);
            if (content.swot() == null && content.valueChain() == null && content.bcg() == null) {
                throw new IllegalArgumentException("El contenido de diagnostico debe incluir FODA, cadena de valor o BCG.");
            }
            if (content.swot() != null) {
                List<DiagnosticItem> items = diagnosticContentMapper.normalizeSwot(plan.id(), content.swot(), true);
                diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.FODA, items);
            }
            if (content.valueChain() != null) {
                List<DiagnosticItem> items = diagnosticContentMapper.normalizeValueChainItems(
                        plan.id(),
                        content.valueChain(),
                        true
                );
                List<DiagnosticAssessment> assessments = diagnosticContentMapper.normalizeValueChainAssessments(
                        plan.id(),
                        content.valueChain(),
                        true
                );
                diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.VALUE_CHAIN, items);
                diagnosticRepository.replaceAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN, assessments);
            }
            if (content.bcg() != null) {
                List<BcgPortfolioItem> products = diagnosticContentMapper.normalizeBcgPortfolio(
                        plan.id(),
                        content.bcg(),
                        true
                );
                List<DiagnosticItem> items = diagnosticContentMapper.normalizeBcgItems(plan.id(), content.bcg(), true);
                diagnosticRepository.replaceBcgPortfolioItems(plan.id(), products);
                diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.BCG, items);
            }
            return plan;
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto para diagnostico no tiene un formato valido.");
        }
    }

    @Override
    public boolean completesPhase(StrategicPlan plan, String contentJson) {
        return false;
    }

    private record DiagnosticsPhaseContent(UpdateSwotCommand swot, UpdateValueChainCommand valueChain, UpdateBcgCommand bcg) {
    }
}
