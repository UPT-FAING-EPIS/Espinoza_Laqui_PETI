package com.strategicti.application.service;

import com.strategicti.application.ports.out.IDiagnosticRepositoryPort;
import com.strategicti.application.usecase.UpdateBcgCommand;
import com.strategicti.application.usecase.UpdateDiagnosticFindingsCommand;
import com.strategicti.application.usecase.UpdatePestCommand;
import com.strategicti.application.usecase.UpdatePorterCommand;
import com.strategicti.application.usecase.UpdateSwotCommand;
import com.strategicti.application.usecase.UpdateValueChainCommand;
import com.strategicti.domain.model.BcgPortfolioItem;
import com.strategicti.domain.model.DiagnosticAssessment;
import com.strategicti.domain.model.DiagnosticFinding;
import com.strategicti.domain.model.DiagnosticItem;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
    public StrategicPlan apply(StrategicPlan plan, String contentJson, Long createdByUserId) {
        try {
            DiagnosticsPhaseContent content = readContent(contentJson);
            if (content.swot() == null
                    && content.pest() == null
                    && content.porter() == null
                    && content.valueChain() == null
                    && content.bcg() == null
                    && !hasFindings(content.findings())) {
                throw new IllegalArgumentException(
                        "El contenido de diagnostico debe incluir una herramienta o un bloque de hallazgos."
                );
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
                List<DiagnosticFinding> findings = diagnosticContentMapper.normalizeValueChainFindings(
                        plan.id(),
                        content.valueChain(),
                        createdByUserId,
                        true
                );
                diagnosticRepository.replaceItems(plan.id(), DiagnosticTool.VALUE_CHAIN, items);
                diagnosticRepository.replaceAssessments(plan.id(), DiagnosticTool.VALUE_CHAIN, assessments);
                diagnosticRepository.replaceFindings(plan.id(), DiagnosticTool.VALUE_CHAIN, findings);
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
            if (content.pest() != null) {
                List<DiagnosticAssessment> assessments = diagnosticContentMapper.normalizePestAssessments(
                        plan.id(),
                        content.pest(),
                        true
                );
                List<DiagnosticFinding> findings = diagnosticContentMapper.normalizePestFindings(
                        plan.id(),
                        content.pest(),
                        createdByUserId,
                        true
                );
                diagnosticRepository.replaceAssessments(plan.id(), DiagnosticTool.PEST, assessments);
                diagnosticRepository.replaceFindings(plan.id(), DiagnosticTool.PEST, findings);
            }
            if (content.porter() != null) {
                List<DiagnosticAssessment> assessments = diagnosticContentMapper.normalizePorterAssessments(
                        plan.id(),
                        content.porter(),
                        true
                );
                List<DiagnosticFinding> findings = diagnosticContentMapper.normalizePorterFindings(
                        plan.id(),
                        content.porter(),
                        createdByUserId,
                        true
                );
                diagnosticRepository.replaceAssessments(plan.id(), DiagnosticTool.PORTER, assessments);
                diagnosticRepository.replaceFindings(plan.id(), DiagnosticTool.PORTER, findings);
            }
            Set<DiagnosticTool> alreadyApplied = new HashSet<>();
            if (content.pest() != null) alreadyApplied.add(DiagnosticTool.PEST);
            if (content.porter() != null) alreadyApplied.add(DiagnosticTool.PORTER);
            if (content.valueChain() != null) alreadyApplied.add(DiagnosticTool.VALUE_CHAIN);
            applyFindings(plan.id(), content.findings(), createdByUserId, alreadyApplied);
            return plan;
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto para diagnostico no tiene un formato valido.");
        }
    }

    @Override
    public boolean completesPhase(StrategicPlan plan, String contentJson) {
        try {
            return readContent(contentJson).swot() != null;
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto para diagnostico no tiene un formato valido.");
        }
    }

    private DiagnosticsPhaseContent readContent(String contentJson) throws JacksonException {
        return objectMapper.readValue(contentJson, DiagnosticsPhaseContent.class);
    }

    private void applyFindings(
            Long planId,
            List<UpdateDiagnosticFindingsCommand> findingUpdates,
            Long createdByUserId,
            Set<DiagnosticTool> alreadyApplied
    ) {
        if (findingUpdates == null) {
            return;
        }
        Set<DiagnosticTool> processedSources = new HashSet<>();
        for (UpdateDiagnosticFindingsCommand update : findingUpdates) {
            if (update == null) {
                continue;
            }
            if (alreadyApplied.contains(update.source())) {
                throw new IllegalArgumentException(
                        "Los hallazgos " + update.source().name() + " deben incluirse dentro de su bloque."
                );
            }
            if (update.source() != null && !processedSources.add(update.source())) {
                throw new IllegalArgumentException("Cada herramienta de origen solo puede incluir un bloque de hallazgos.");
            }
            List<DiagnosticFinding> findings = diagnosticContentMapper.normalizeFindings(
                    planId,
                    update,
                    createdByUserId
            );
            diagnosticRepository.replaceFindings(planId, update.source(), findings);
        }
    }

    private boolean hasFindings(List<UpdateDiagnosticFindingsCommand> findingUpdates) {
        return findingUpdates != null && findingUpdates.stream().anyMatch(update -> update != null);
    }

    private record DiagnosticsPhaseContent(
            UpdateSwotCommand swot,
            UpdatePestCommand pest,
            UpdatePorterCommand porter,
            UpdateValueChainCommand valueChain,
            UpdateBcgCommand bcg,
            List<UpdateDiagnosticFindingsCommand> findings
    ) {
    }
}
