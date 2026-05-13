package com.strategicti.application.service;

import com.strategicti.application.usecase.StrategicObjectiveCommand;
import com.strategicti.domain.model.CompanyProfile;
import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Component
public class IdentityPhaseContentApplier implements PhaseContentApplier {
    private final ObjectMapper objectMapper;
    private final StrategicPlanContentMapper contentMapper;

    public IdentityPhaseContentApplier(ObjectMapper objectMapper, StrategicPlanContentMapper contentMapper) {
        this.objectMapper = objectMapper;
        this.contentMapper = contentMapper;
    }

    @Override
    public PetiPhase phase() {
        return PetiPhase.IDENTITY;
    }

    @Override
    public StrategicPlan apply(StrategicPlan plan, String contentJson) {
        try {
            IdentityPhaseContent content = objectMapper.readValue(contentJson, IdentityPhaseContent.class);
            CompanyProfile current = plan.profile();
            StrategicPlan withProfile = plan.updateProfile(new CompanyProfile(
                    valueOrCurrent(content.companyName(), current.companyName()),
                    valueOrCurrent(content.businessLine(), current.businessLine()),
                    valueOrCurrent(content.description(), current.description()),
                    current.mission(),
                    current.vision(),
                    current.valuesText()
            ));
            return withProfile.updateIdentity(
                    contentMapper.clean(content.mission()),
                    contentMapper.clean(content.vision()),
                    contentMapper.clean(content.valuesText()),
                    contentMapper.normalizeObjectives(content.objectives())
            );
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto para identidad no tiene un formato valido.");
        }
    }

    private String valueOrCurrent(String proposed, String current) {
        String cleanProposed = contentMapper.clean(proposed);
        return cleanProposed.isBlank() ? contentMapper.clean(current) : cleanProposed;
    }

    private record IdentityPhaseContent(
            String companyName,
            String businessLine,
            String description,
            String mission,
            String vision,
            String valuesText,
            List<StrategicObjectiveCommand> objectives
    ) {
    }
}
