package com.strategicti.infrastructure.persistence.entity;

import com.strategicti.domain.model.PetiPhase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "strategic_plans")
public class StrategicPlanJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean currentPlan = true;

    private String companyName;
    private String businessLine;

    @Column(length = 2000)
    private String description;

    @Column(length = 2000)
    private String mission;

    @Column(length = 2000)
    private String vision;

    @Column(length = 2000)
    private String valuesText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PetiPhase activePhase = PetiPhase.IDENTITY;

    private boolean identityCompleted;
    private boolean diagnosticsCompleted;
    private boolean formulationCompleted;
    private boolean consolidationCompleted;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public boolean isCurrentPlan() {
        return currentPlan;
    }

    public void setCurrentPlan(boolean currentPlan) {
        this.currentPlan = currentPlan;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getBusinessLine() {
        return businessLine;
    }

    public void setBusinessLine(String businessLine) {
        this.businessLine = businessLine;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mission) {
        this.mission = mission;
    }

    public String getVision() {
        return vision;
    }

    public void setVision(String vision) {
        this.vision = vision;
    }

    public String getValuesText() {
        return valuesText;
    }

    public void setValuesText(String valuesText) {
        this.valuesText = valuesText;
    }

    public PetiPhase getActivePhase() {
        return activePhase;
    }

    public void setActivePhase(PetiPhase activePhase) {
        this.activePhase = activePhase;
    }

    public boolean isIdentityCompleted() {
        return identityCompleted;
    }

    public void setIdentityCompleted(boolean identityCompleted) {
        this.identityCompleted = identityCompleted;
    }

    public boolean isDiagnosticsCompleted() {
        return diagnosticsCompleted;
    }

    public void setDiagnosticsCompleted(boolean diagnosticsCompleted) {
        this.diagnosticsCompleted = diagnosticsCompleted;
    }

    public boolean isFormulationCompleted() {
        return formulationCompleted;
    }

    public void setFormulationCompleted(boolean formulationCompleted) {
        this.formulationCompleted = formulationCompleted;
    }

    public boolean isConsolidationCompleted() {
        return consolidationCompleted;
    }

    public void setConsolidationCompleted(boolean consolidationCompleted) {
        this.consolidationCompleted = consolidationCompleted;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
