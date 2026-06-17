package com.strategicti.application.service;

import com.strategicti.domain.model.PetiPhase;
import com.strategicti.domain.model.StrategicPlan;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

@Component
public class FormulationPhaseContentApplier implements PhaseContentApplier {
    private static final Set<String> RELATIONS = Set.of("FO", "AF", "AD", "OD");

    private final ObjectMapper objectMapper;

    public FormulationPhaseContentApplier(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public PetiPhase phase() {
        return PetiPhase.FORMULATION;
    }

    @Override
    public StrategicPlan apply(StrategicPlan plan, String contentJson, Long createdByUserId) {
        JsonNode content = read(contentJson);
        JsonNode identification = content.get("strategyIdentification");
        JsonNode came = content.get("came");
        if (identification == null && came == null) {
            throw new IllegalArgumentException("El contenido de formulacion debe incluir identificacion estrategica o matriz CAME.");
        }
        if (came != null && identification == null) {
            throw new IllegalArgumentException("La matriz CAME debe conservar la identificacion estrategica aprobada.");
        }
        if (identification != null) {
            validateIdentification(identification);
        }
        if (came != null) {
            validateCame(came);
        }
        return plan;
    }

    @Override
    public boolean completesPhase(StrategicPlan plan, String contentJson) {
        return read(contentJson).get("came") != null;
    }

    private JsonNode read(String contentJson) {
        try {
            return objectMapper.readTree(contentJson);
        } catch (JacksonException exception) {
            throw new IllegalArgumentException("El contenido propuesto para formulacion no tiene un formato valido.");
        }
    }

    private void validateIdentification(JsonNode identification) {
        int strengths = requiredArraySize(identification, "strengths");
        int opportunities = requiredArraySize(identification, "opportunities");
        int weaknesses = requiredArraySize(identification, "weaknesses");
        int threats = requiredArraySize(identification, "threats");
        JsonNode scores = identification.get("scores");
        if (scores == null || !scores.isObject()) {
            throw new IllegalArgumentException("La identificacion estrategica debe incluir las matrices de puntuacion.");
        }

        int fo = matrixScore(scores.get("FO"), strengths, opportunities);
        int af = matrixScore(scores.get("AF"), strengths, threats);
        int od = matrixScore(scores.get("OD"), weaknesses, opportunities);
        int ad = matrixScore(scores.get("AD"), weaknesses, threats);
        String selected = text(identification.get("selectedStrategy"));
        if (!RELATIONS.contains(selected)) {
            throw new IllegalArgumentException("Seleccione la estrategia con mayor puntuacion.");
        }
        int max = Math.max(Math.max(fo, af), Math.max(od, ad));
        int selectedScore = switch (selected) {
            case "FO" -> fo;
            case "AF" -> af;
            case "OD" -> od;
            case "AD" -> ad;
            default -> -1;
        };
        if (max <= 0 || selectedScore != max) {
            throw new IllegalArgumentException("La estrategia seleccionada debe tener la mayor puntuacion.");
        }
    }

    private int requiredArraySize(JsonNode node, String field) {
        JsonNode array = node.get(field);
        if (array == null || !array.isArray() || array.size() == 0) {
            throw new IllegalArgumentException("La identificacion estrategica requiere FODA aprobado completo.");
        }
        return array.size();
    }

    private int matrixScore(JsonNode matrix, int rows, int columns) {
        if (matrix == null || !matrix.isArray() || matrix.size() != rows) {
            throw new IllegalArgumentException("Las matrices de identificacion estrategica no coinciden con el FODA aprobado.");
        }
        int total = 0;
        for (int row = 0; row < rows; row++) {
            JsonNode values = matrix.get(row);
            if (values == null || !values.isArray() || values.size() != columns) {
                throw new IllegalArgumentException("Las matrices de identificacion estrategica no coinciden con el FODA aprobado.");
            }
            for (int column = 0; column < columns; column++) {
                int score = values.get(column).asInt(-1);
                if (score < 0 || score > 4) {
                    throw new IllegalArgumentException("Cada relacion estrategica debe puntuarse entre 0 y 4.");
                }
                total += score;
            }
        }
        return total;
    }

    private void validateCame(JsonNode came) {
        requiredActions(came, "correctWeaknesses", "corregir las debilidades");
        requiredActions(came, "faceThreats", "afrontar las amenazas");
        requiredActions(came, "maintainStrengths", "mantener las fortalezas");
        requiredActions(came, "exploitOpportunities", "explotar las oportunidades");
    }

    private void requiredActions(JsonNode came, String field, String label) {
        JsonNode actions = came.get(field);
        if (actions == null || !actions.isArray()) {
            throw new IllegalArgumentException("La matriz CAME debe incluir acciones para " + label + ".");
        }
        int filled = 0;
        for (JsonNode action : actions) {
            String description = text(action.get("action")).trim();
            if (description.isBlank()) {
                continue;
            }
            String relatedItem = text(action.get("relatedItem")).trim();
            if (relatedItem.isBlank()) {
                throw new IllegalArgumentException("Cada accion CAME debe vincularse a un resultado FODA.");
            }
            filled++;
        }
        if (filled == 0) {
            throw new IllegalArgumentException("Registre al menos una accion para " + label + ".");
        }
    }

    private String text(JsonNode node) {
        return node == null ? "" : node.asText("");
    }
}
