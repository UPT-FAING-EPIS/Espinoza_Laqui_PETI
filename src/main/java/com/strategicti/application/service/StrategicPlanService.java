package com.strategicti.application.service;

import com.strategicti.application.ports.out.StrategicPlanRepositoryPort;
import com.strategicti.application.usecase.CompanyProfileCommand;
import com.strategicti.application.usecase.PlanSummary;
import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.PhaseSnapshot;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.domain.service.PetiProgressPolicy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StrategicPlanService {
    private final StrategicPlanRepositoryPort repository;
    private final PetiProgressPolicy progressPolicy = new PetiProgressPolicy();

    public StrategicPlanService(StrategicPlanRepositoryPort repository) {
        this.repository = repository;
    }

    @Transactional
    public PlanSummary getCurrentPlan() {
        StrategicPlan plan = repository.findCurrent().orElseGet(() -> repository.save(StrategicPlan.newPlan()));
        return toSummary(plan);
    }

    @Transactional
    public PlanSummary updateCompanyProfile(CompanyProfileCommand command) {
        StrategicPlan current = repository.findCurrent().orElseGet(StrategicPlan::newPlan);
        StrategicPlan updated = current.updateProfile(new CompanyProfile(
                clean(command.companyName()),
                clean(command.businessLine()),
                clean(command.description()),
                clean(command.mission()),
                clean(command.vision()),
                clean(command.valuesText())
        ));
        return toSummary(repository.save(updated));
    }

    @Transactional
    public PlanSummary completePhase(PetiPhase phase) {
        StrategicPlan current = repository.findCurrent().orElseGet(StrategicPlan::newPlan);
        progressPolicy.assertPhaseCanBeCompleted(current, phase);
        return toSummary(repository.save(current.complete(phase)));
    }

    private PlanSummary toSummary(StrategicPlan plan) {
        List<PhaseSnapshot> phases = progressPolicy.snapshotsFor(plan);
        int totalProgress = phases.stream()
                .mapToInt(PhaseSnapshot::progress)
                .sum() / phases.size();
        return new PlanSummary(
                plan.id(),
                plan.profile(),
                plan.activePhase(),
                totalProgress,
                phases,
                plan.updatedAt()
        );
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
