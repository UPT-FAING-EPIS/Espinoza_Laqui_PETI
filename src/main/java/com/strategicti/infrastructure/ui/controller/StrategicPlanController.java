package com.strategicti.infrastructure.ui.controller;

import com.strategicti.application.service.StrategicPlanService;
import com.strategicti.application.usecase.CompanyProfileCommand;
import com.strategicti.application.usecase.PlanSummary;
import com.strategicti.domain.model.PetiPhase;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans/current")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class StrategicPlanController {
    private final StrategicPlanService service;

    public StrategicPlanController(StrategicPlanService service) {
        this.service = service;
    }

    @GetMapping
    public PlanSummary current() {
        return service.getCurrentPlan();
    }

    @PutMapping("/company")
    public PlanSummary updateCompanyProfile(@Valid @RequestBody CompanyProfileCommand command) {
        return service.updateCompanyProfile(command);
    }

    @PostMapping("/phases/{phase}/complete")
    public PlanSummary completePhase(@PathVariable PetiPhase phase) {
        return service.completePhase(phase);
    }
}
