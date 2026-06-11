package com.strategicti.domain.model;

public enum ValueChainActivity {
    INFRAESTRUCTURA_EMPRESARIAL(ValueChainActivityType.APOYO),
    GESTION_RECURSOS_HUMANOS(ValueChainActivityType.APOYO),
    COMPRAS(ValueChainActivityType.APOYO),
    DESARROLLO_TECNOLOGICO(ValueChainActivityType.APOYO),
    LOGISTICA_ENTRADA(ValueChainActivityType.PRIMARIA),
    OPERACIONES(ValueChainActivityType.PRIMARIA),
    LOGISTICA_SALIDA(ValueChainActivityType.PRIMARIA),
    MARKETING_VENTAS(ValueChainActivityType.PRIMARIA),
    SERVICIOS(ValueChainActivityType.PRIMARIA);

    private final ValueChainActivityType type;

    ValueChainActivity(ValueChainActivityType type) {
        this.type = type;
    }

    public ValueChainActivityType type() {
        return type;
    }
}
