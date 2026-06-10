package com.strategicti.infrastructure.persistence.entity;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.domain.model.SwotCategory;
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
@Table(name = "diagnostic_findings")
public class DiagnosticFindingJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long planId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DiagnosticTool source;

    @Column(nullable = false, length = 80, columnDefinition = "varchar(80) default ''")
    private String sourceDimension = "";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private SwotCategory category;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(length = 2000)
    private String evidence;

    @Column(length = 1000)
    private String impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DiagnosticPriority priority;

    @Column(nullable = false)
    private boolean selectedForFoda;

    @Column(nullable = false)
    private Long createdByUserId;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    @PrePersist
    void createTimestamps() {
        Instant now = Instant.now();
        createdAt = createdAt == null ? now : createdAt;
        updatedAt = now;
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getPlanId() {
        return planId;
    }

    public void setPlanId(Long planId) {
        this.planId = planId;
    }

    public DiagnosticTool getSource() {
        return source;
    }

    public void setSource(DiagnosticTool source) {
        this.source = source;
    }

    public SwotCategory getCategory() {
        return category;
    }

    public String getSourceDimension() {
        return sourceDimension;
    }

    public void setSourceDimension(String sourceDimension) {
        this.sourceDimension = sourceDimension;
    }

    public void setCategory(SwotCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEvidence() {
        return evidence;
    }

    public void setEvidence(String evidence) {
        this.evidence = evidence;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public DiagnosticPriority getPriority() {
        return priority;
    }

    public void setPriority(DiagnosticPriority priority) {
        this.priority = priority;
    }

    public boolean isSelectedForFoda() {
        return selectedForFoda;
    }

    public void setSelectedForFoda(boolean selectedForFoda) {
        this.selectedForFoda = selectedForFoda;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
