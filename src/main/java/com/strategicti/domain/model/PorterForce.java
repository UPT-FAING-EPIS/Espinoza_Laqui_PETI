package com.strategicti.domain.model;

public enum PorterForce {
    INDUSTRY_RIVALRY("Rivalidad entre competidores"),
    NEW_ENTRANTS("Amenaza de nuevos entrantes"),
    BUYER_POWER("Poder de negociacion de clientes"),
    SUPPLIER_POWER("Poder de negociacion de proveedores"),
    SUBSTITUTES("Amenaza de productos sustitutos");

    private final String label;

    PorterForce(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
