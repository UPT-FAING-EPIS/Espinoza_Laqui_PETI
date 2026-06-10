package com.strategicti.domain.model;

import java.util.Arrays;

public enum PestQuestion {
    Q01(1, PestFactor.SOCIAL_DEMOGRAPHIC, "Los cambios en la composicion etnica de los consumidores de nuestro mercado tienen un impacto notable."),
    Q02(2, PestFactor.SOCIAL_DEMOGRAPHIC, "El envejecimiento de la poblacion tiene un impacto importante en la demanda."),
    Q03(3, PestFactor.SOCIAL_DEMOGRAPHIC, "Los nuevos estilos de vida y tendencias originan cambios en la oferta de nuestro sector."),
    Q04(4, PestFactor.SOCIAL_DEMOGRAPHIC, "El envejecimiento de la poblacion tiene un impacto importante en la oferta del sector donde operamos."),
    Q05(5, PestFactor.SOCIAL_DEMOGRAPHIC, "Las variaciones en el nivel de riqueza de la poblacion impactan considerablemente en la demanda del sector."),
    Q06(6, PestFactor.POLITICAL, "La legislacion fiscal afecta considerablemente a la economia de las empresas del sector donde operamos."),
    Q07(7, PestFactor.POLITICAL, "La legislacion laboral afecta considerablemente a la operativa del sector donde actuamos."),
    Q08(8, PestFactor.POLITICAL, "Las subvenciones otorgadas por las administraciones publicas son claves para el desarrollo competitivo del mercado."),
    Q09(9, PestFactor.POLITICAL, "La legislacion de proteccion al consumidor impacta de forma importante en la produccion de bienes o servicios."),
    Q10(10, PestFactor.POLITICAL, "La normativa regional tiene un impacto considerable en el funcionamiento del sector donde actuamos."),
    Q11(11, PestFactor.ECONOMIC, "Las expectativas generales de crecimiento economico afectan crucialmente al mercado donde operamos."),
    Q12(12, PestFactor.ECONOMIC, "La politica de tipos de interes es fundamental para el desarrollo financiero del sector."),
    Q13(13, PestFactor.ECONOMIC, "La globalizacion permite a nuestra industria acceder a oportunidades importantes en nuevos mercados."),
    Q14(14, PestFactor.ECONOMIC, "La situacion del empleo es fundamental para el desarrollo economico de nuestra empresa y sector."),
    Q15(15, PestFactor.ECONOMIC, "Las expectativas del ciclo economico del sector impactan en la situacion economica de sus empresas."),
    Q16(16, PestFactor.TECHNOLOGICAL, "Las administraciones publicas incentivan el esfuerzo tecnologico de las empresas de nuestro sector."),
    Q17(17, PestFactor.TECHNOLOGICAL, "Internet, el comercio electronico y otras tecnologias impactan en la demanda y la competencia."),
    Q18(18, PestFactor.TECHNOLOGICAL, "El empleo de nuevas tecnologias de informacion es generalizado en el sector donde trabajamos."),
    Q19(19, PestFactor.TECHNOLOGICAL, "En nuestro sector es importante ser pionero o referente en el uso de aplicaciones tecnologicas."),
    Q20(20, PestFactor.TECHNOLOGICAL, "Para ser competitivos en nuestro sector es necesario innovar constantemente."),
    Q21(21, PestFactor.ENVIRONMENTAL, "La legislacion medioambiental afecta al desarrollo de nuestro sector."),
    Q22(22, PestFactor.ENVIRONMENTAL, "Los clientes exigen que las empresas sean socialmente responsables en el plano medioambiental."),
    Q23(23, PestFactor.ENVIRONMENTAL, "Las politicas medioambientales son una fuente de ventajas competitivas en nuestro sector."),
    Q24(24, PestFactor.ENVIRONMENTAL, "La preocupacion social por el medio ambiente impacta en la demanda de productos o servicios."),
    Q25(25, PestFactor.ENVIRONMENTAL, "El factor ecologico es una fuente clara de diferenciacion en el sector donde opera la empresa.");

    private final int number;
    private final PestFactor factor;
    private final String statement;

    PestQuestion(int number, PestFactor factor, String statement) {
        this.number = number;
        this.factor = factor;
        this.statement = statement;
    }

    public int number() {
        return number;
    }

    public PestFactor factor() {
        return factor;
    }

    public String statement() {
        return statement;
    }

    public static PestQuestion fromNumber(int number) {
        return Arrays.stream(values())
                .filter(question -> question.number == number)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("La pregunta PEST debe estar entre 1 y 25."));
    }
}
