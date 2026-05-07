package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;
import com.strategicti.infrastructure.persistence.entity.StrategicPlanJpaEntity;
import org.springframework.stereotype.Component;

import java.util.EnumSet;
import java.util.Set;

@Component
public class StrategicPlanPersistenceFactory {
    public StrategicPlanJpaEntity toEntity(StrategicPlan plan, StrategicPlanJpaEntity entity) {
        entity.setCurrentPlan(true);
        entity.setCompanyName(plan.profile().companyName());
        entity.setBusinessLine(plan.profile().businessLine());
        entity.setDescription(plan.profile().description());
        entity.setMission(plan.profile().mission());
        entity.setVision(plan.profile().vision());
        entity.setValuesText(plan.profile().valuesText());
        entity.setActivePhase(plan.activePhase());
        entity.setIdentityCompleted(plan.isCompleted(PetiPhase.IDENTITY));
        entity.setDiagnosticsCompleted(plan.isCompleted(PetiPhase.DIAGNOSTICS));
        entity.setFormulationCompleted(plan.isCompleted(PetiPhase.FORMULATION));
        entity.setConsolidationCompleted(plan.isCompleted(PetiPhase.CONSOLIDATION));
        return entity;
    }

    public StrategicPlan toDomain(StrategicPlanJpaEntity entity) {
        return new StrategicPlan(
                entity.getId(),
                new CompanyProfile(
                        emptyIfNull(entity.getCompanyName()),
                        emptyIfNull(entity.getBusinessLine()),
                        emptyIfNull(entity.getDescription()),
                        emptyIfNull(entity.getMission()),
                        emptyIfNull(entity.getVision()),
                        emptyIfNull(entity.getValuesText())
                ),
                entity.getActivePhase(),
                completedPhases(entity),
                entity.getUpdatedAt()
        );
    }

    private Set<PetiPhase> completedPhases(StrategicPlanJpaEntity entity) {
        Set<PetiPhase> completed = EnumSet.noneOf(PetiPhase.class);
        if (entity.isIdentityCompleted()) {
            completed.add(PetiPhase.IDENTITY);
        }
        if (entity.isDiagnosticsCompleted()) {
            completed.add(PetiPhase.DIAGNOSTICS);
        }
        if (entity.isFormulationCompleted()) {
            completed.add(PetiPhase.FORMULATION);
        }
        if (entity.isConsolidationCompleted()) {
            completed.add(PetiPhase.CONSOLIDATION);
        }
        return completed;
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
