package com.strategicti.domain.model;

public enum ValueChainDimension {
    PROCESS_NORMALIZATION("IPTN", "Procesos y normalizacion"),
    TECHNOLOGY_IMPROVEMENT("ITPM", "Tecnologia y mejora"),
    PRODUCT_PRODUCTIVITY("IPP", "Producto y productividad"),
    ORGANIZATION_STRATEGY("IOE", "Organizacion y estrategia"),
    CUSTOMER_DISTRIBUTION("ICD", "Cliente y distribucion");

    private final String code;
    private final String label;

    ValueChainDimension(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }
}
