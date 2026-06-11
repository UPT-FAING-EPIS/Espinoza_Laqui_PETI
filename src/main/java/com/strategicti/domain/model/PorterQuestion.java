package com.strategicti.domain.model;

import java.util.Arrays;

public enum PorterQuestion {
    Q01(1, PorterForce.INDUSTRY_RIVALRY, "Existe un gran numero de competidores con capacidades similares."),
    Q02(2, PorterForce.INDUSTRY_RIVALRY, "El crecimiento lento del sector intensifica la disputa por participacion de mercado."),
    Q03(3, PorterForce.INDUSTRY_RIVALRY, "Los productos o servicios del sector presentan poca diferenciacion."),
    Q04(4, PorterForce.INDUSTRY_RIVALRY, "Los costos fijos o de almacenamiento impulsan una competencia agresiva."),
    Q05(5, PorterForce.INDUSTRY_RIVALRY, "Las barreras de salida mantienen competidores en el mercado aun con baja rentabilidad."),
    Q06(6, PorterForce.NEW_ENTRANTS, "Los requerimientos de capital para ingresar al sector son bajos."),
    Q07(7, PorterForce.NEW_ENTRANTS, "Las economias de escala existentes ofrecen poca proteccion frente a nuevos entrantes."),
    Q08(8, PorterForce.NEW_ENTRANTS, "El acceso a tecnologia y canales de distribucion es sencillo para nuevos competidores."),
    Q09(9, PorterForce.NEW_ENTRANTS, "La fidelidad de los clientes y sus costos de cambio son bajos."),
    Q10(10, PorterForce.NEW_ENTRANTS, "Las regulaciones, patentes o tramites representan pocas barreras de entrada."),
    Q11(11, PorterForce.BUYER_POWER, "Un numero reducido de clientes concentra una parte importante de las compras."),
    Q12(12, PorterForce.BUYER_POWER, "Los clientes representan una proporcion elevada de las ventas del sector."),
    Q13(13, PorterForce.BUYER_POWER, "Los clientes pueden cambiar de proveedor con facilidad y bajo costo."),
    Q14(14, PorterForce.BUYER_POWER, "Los clientes disponen de informacion suficiente para comparar y negociar condiciones."),
    Q15(15, PorterForce.BUYER_POWER, "Los clientes pueden integrar actividades del proveedor o producir internamente la solucion."),
    Q16(16, PorterForce.SUPPLIER_POWER, "Un numero reducido de proveedores concentra la oferta de insumos clave."),
    Q17(17, PorterForce.SUPPLIER_POWER, "Los insumos de los proveedores son criticos y tienen pocos sustitutos disponibles."),
    Q18(18, PorterForce.SUPPLIER_POWER, "Cambiar de proveedor implica costos, riesgos o tiempos elevados."),
    Q19(19, PorterForce.SUPPLIER_POWER, "La organizacion representa una parte poco importante de las ventas de sus proveedores."),
    Q20(20, PorterForce.SUPPLIER_POWER, "Los proveedores tienen capacidad para vender directamente al cliente final."),
    Q21(21, PorterForce.SUBSTITUTES, "Existen numerosas alternativas que satisfacen la misma necesidad del cliente."),
    Q22(22, PorterForce.SUBSTITUTES, "Los productos sustitutos ofrecen una relacion precio-beneficio atractiva."),
    Q23(23, PorterForce.SUBSTITUTES, "Los clientes pueden adoptar productos sustitutos con facilidad y bajo costo."),
    Q24(24, PorterForce.SUBSTITUTES, "Los cambios tecnologicos o de comportamiento aceleran la aparicion de sustitutos."),
    Q25(25, PorterForce.SUBSTITUTES, "Ofertas provenientes de otros sectores pueden reemplazar nuestra solucion.");

    private final int number;
    private final PorterForce force;
    private final String statement;

    PorterQuestion(int number, PorterForce force, String statement) {
        this.number = number;
        this.force = force;
        this.statement = statement;
    }

    public int number() {
        return number;
    }

    public PorterForce force() {
        return force;
    }

    public String statement() {
        return statement;
    }

    public static PorterQuestion fromNumber(int number) {
        return Arrays.stream(values())
                .filter(question -> question.number == number)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La pregunta Porter debe estar entre 1 y 25."));
    }
}
