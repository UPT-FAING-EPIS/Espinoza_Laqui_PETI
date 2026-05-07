package com.strategicti.domain.model;

public record CompanyProfile(
        String companyName,
        String businessLine,
        String description,
        String mission,
        String vision,
        String valuesText
) {
    public static CompanyProfile empty() {
        return new CompanyProfile("", "", "", "", "", "");
    }

    public boolean isIdentityReady() {
        return hasText(companyName)
                && hasText(businessLine)
                && hasText(description)
                && hasText(mission)
                && hasText(vision)
                && hasText(valuesText);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
