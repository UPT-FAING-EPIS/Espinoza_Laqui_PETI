package com.strategicti.domain.model;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;

public enum ValueChainQuestion {
    ZERO_DEFECTS(
            1,
            ValueChainActivity.OPERACIONES,
            "La empresa tiene una politica sistematizada de cero defectos en la produccion de productos/servicios.",
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    ADVANCED_PRODUCTIVE_MEANS(
            2,
            ValueChainActivity.OPERACIONES,
            "La empresa emplea los medios productivos tecnologicamente mas avanzados de su sector.",
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    MANAGEMENT_INFORMATION_SYSTEM(
            3,
            ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
            "La empresa dispone de un sistema de informacion y control de gestion eficiente y eficaz.",
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    FUTURE_TECHNICAL_READINESS(
            4,
            ValueChainActivity.DESARROLLO_TECNOLOGICO,
            "Los medios tecnicos y tecnologicos de la empresa estan preparados para competir en un futuro a corto, medio y largo plazo.",
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT
    ),
    RDI_REFERENCE(
            5,
            ValueChainActivity.DESARROLLO_TECNOLOGICO,
            "La empresa es un referente en su sector en I+D+i.",
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT
    ),
    PROCEDURE_EXCELLENCE(
            6,
            ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
            "La excelencia de los procedimientos de la empresa, por ejemplo ISO, es una principal fuente de ventaja competitiva.",
            ValueChainDimension.PROCESS_NORMALIZATION
    ),
    WEB_RELATIONSHIP_CHANNEL(
            7,
            ValueChainActivity.MARKETING_VENTAS,
            "La empresa dispone de pagina web y la emplea no solo como escaparate virtual, sino tambien para establecer relaciones con clientes y proveedores.",
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    HARD_TO_IMITATE_TECHNOLOGY(
            8,
            ValueChainActivity.DESARROLLO_TECNOLOGICO,
            "Los productos/servicios que desarrolla la empresa llevan incorporada una tecnologia dificil de imitar.",
            ValueChainDimension.PRODUCT_PRODUCTIVITY
    ),
    PRODUCTION_COST_OPTIMIZATION(
            9,
            ValueChainActivity.OPERACIONES,
            "La empresa es referente en su sector en la optimizacion, en terminos de coste, de su cadena de produccion.",
            ValueChainDimension.PRODUCT_PRODUCTIVITY
    ),
    DIGITALIZATION_ADVANTAGE(
            10,
            ValueChainActivity.DESARROLLO_TECNOLOGICO,
            "La informatizacion de la empresa es una fuente de ventaja competitiva clara respecto a sus competidores.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    DISTRIBUTION_CHANNELS_ADVANTAGE(
            11,
            ValueChainActivity.LOGISTICA_SALIDA,
            "Los canales de distribucion de la empresa son una importante fuente de ventajas competitivas.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    CUSTOMER_DIFFERENTIAL_VALUE(
            12,
            ValueChainActivity.MARKETING_VENTAS,
            "Los productos/servicios de la empresa son altamente y diferencialmente valorados por el cliente respecto a los competidores.",
            ValueChainDimension.PRODUCT_PRODUCTIVITY
    ),
    MARKETING_SALES_PLAN(
            13,
            ValueChainActivity.MARKETING_VENTAS,
            "La empresa dispone y ejecuta un sistematico plan de marketing y ventas.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    FINANCIAL_MANAGEMENT(
            14,
            ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
            "La empresa tiene optimizada su gestion financiera.",
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    CUSTOMER_RELATION_IMPROVEMENT(
            15,
            ValueChainActivity.SERVICIOS,
            "La empresa busca continuamente mejorar la relacion con sus clientes reduciendo plazos, personalizando la oferta o mejorando las condiciones de entrega.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    SUCCESSFUL_INNOVATION_LAUNCH(
            16,
            ValueChainActivity.DESARROLLO_TECNOLOGICO,
            "La empresa es referente en su sector en el lanzamiento de innovadores productos y servicios de exito demostrado en el mercado.",
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    STRATEGIC_HR(
            17,
            ValueChainActivity.GESTION_RECURSOS_HUMANOS,
            "Los recursos humanos son especialmente responsables del exito de la empresa y se consideran un activo estrategico.",
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY
    ),
    MOTIVATED_WORKFORCE(
            18,
            ValueChainActivity.GESTION_RECURSOS_HUMANOS,
            "Se tiene una plantilla altamente motivada, que conoce con claridad las metas, objetivos y estrategias de la organizacion.",
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    CLEAR_STRATEGY(
            19,
            ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
            "La empresa siempre trabaja conforme a una estrategia y objetivos claros.",
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    WORKING_CAPITAL(
            20,
            ValueChainActivity.INFRAESTRUCTURA_EMPRESARIAL,
            "La gestion del circulante esta optimizada.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    PRODUCT_POSITIONING(
            21,
            ValueChainActivity.MARKETING_VENTAS,
            "Se tiene definido claramente el posicionamiento estrategico de todos los productos de la empresa.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    BRAND_POLICY(
            22,
            ValueChainActivity.MARKETING_VENTAS,
            "Se dispone de una politica de marca basada en reputacion, relacion con el cliente y posicionamiento estrategico.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY
    ),
    LOYAL_CUSTOMER_PORTFOLIO(
            23,
            ValueChainActivity.SERVICIOS,
            "La cartera de clientes de la empresa esta altamente fidelizada porque su principal proposito es deleitarlos dia a dia.",
            ValueChainDimension.ORGANIZATION_STRATEGY
    ),
    SALES_MARKETING_ADVANTAGE(
            24,
            ValueChainActivity.MARKETING_VENTAS,
            "La politica y equipo de ventas y marketing es una importante ventaja competitiva de la empresa respecto al sector.",
            ValueChainDimension.PROCESS_NORMALIZATION,
            ValueChainDimension.TECHNOLOGY_IMPROVEMENT,
            ValueChainDimension.PRODUCT_PRODUCTIVITY,
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    ),
    CUSTOMER_SERVICE_ADVANTAGE(
            25,
            ValueChainActivity.SERVICIOS,
            "El servicio al cliente que presta la empresa es una de sus principales ventajas competitivas respecto a sus competidores.",
            ValueChainDimension.ORGANIZATION_STRATEGY,
            ValueChainDimension.CUSTOMER_DISTRIBUTION
    );

    private final int number;
    private final ValueChainActivity activity;
    private final String statement;
    private final Set<ValueChainDimension> dimensions;

    ValueChainQuestion(int number, ValueChainActivity activity, String statement, ValueChainDimension firstDimension, ValueChainDimension... otherDimensions) {
        this.number = number;
        this.activity = activity;
        this.statement = statement;
        this.dimensions = EnumSet.of(firstDimension, otherDimensions);
    }

    public int number() {
        return number;
    }

    public ValueChainActivity activity() {
        return activity;
    }

    public String statement() {
        return statement;
    }

    public Set<ValueChainDimension> dimensions() {
        return dimensions;
    }

    public static ValueChainQuestion fromNumber(int number) {
        return Arrays.stream(values())
                .filter(question -> question.number == number)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La pregunta de cadena de valor no existe."));
    }

    public static ValueChainQuestion fromStatement(String statement) {
        if (statement == null || statement.isBlank()) {
            return null;
        }
        String normalized = normalize(statement);
        return Arrays.stream(values())
                .filter(question -> normalize(question.statement).equals(normalized))
                .findFirst()
                .orElse(null);
    }

    private static String normalize(String value) {
        return value.trim().replaceAll("\\s+", " ").toLowerCase();
    }
}
