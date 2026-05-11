package com.strategicti.domain.model;

public enum DefaultView {
    CURRENT_PLAN(false),
    MY_GROUPS(false),
    USER_MANAGEMENT(true),
    GROUP_MANAGEMENT(true);

    private final boolean adminOnly;

    DefaultView(boolean adminOnly) {
        this.adminOnly = adminOnly;
    }

    public boolean isAvailableTo(SystemRole role) {
        return !adminOnly || role == SystemRole.ADMINISTRADOR;
    }

    public static DefaultView forRole(SystemRole role) {
        if (role == SystemRole.ADMINISTRADOR) {
            return USER_MANAGEMENT;
        }
        return MY_GROUPS;
    }
}
