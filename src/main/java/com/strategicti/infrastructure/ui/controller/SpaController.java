package com.strategicti.infrastructure.ui.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {
    @GetMapping({
            "/",
            "/login",
            "/dashboard",
            "/plan",
            "/groups/{groupId}/plan",
            "/requests",
            "/profile",
            "/my-groups",
            "/admin/users",
            "/admin/groups"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
