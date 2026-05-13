package com.strategicti.application.service;

import com.strategicti.application.usecase.StrategicObjectiveCommand;
import com.strategicti.domain.model.StrategicObjective;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class StrategicPlanContentMapper {
    public List<StrategicObjective> normalizeObjectives(List<StrategicObjectiveCommand> commands) {
        if (commands == null) {
            return List.of();
        }

        List<StrategicObjective> objectives = new ArrayList<>();
        for (StrategicObjectiveCommand command : commands) {
            if (command == null) {
                continue;
            }
            String generalObjective = clean(command.generalObjective());
            List<String> specificObjectives = cleanSpecificObjectives(command.specificObjectives());
            if (generalObjective.isBlank() && specificObjectives.isEmpty()) {
                continue;
            }
            if (generalObjective.isBlank()) {
                throw new IllegalArgumentException("El objetivo estrategico no puede estar vacio.");
            }
            objectives.add(new StrategicObjective(generalObjective, specificObjectives));
        }
        return objectives;
    }

    public List<String> cleanSpecificObjectives(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .map(this::clean)
                .filter(value -> !value.isBlank())
                .toList();
    }

    public String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
