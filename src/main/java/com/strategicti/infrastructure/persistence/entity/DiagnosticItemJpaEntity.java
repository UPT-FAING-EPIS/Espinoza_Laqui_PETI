package com.strategicti.infrastructure.persistence.entity;

import com.strategicti.domain.model.DiagnosticPriority;
import com.strategicti.domain.model.DiagnosticTool;
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
@Table(name = "diagnostic_items")
public class DiagnosticItemJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long planId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DiagnosticTool tool;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DiagnosticPriority priority;

    @Column(nullable = false)
    private int position;

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

    public Long getPlanId() {
        return planId;
    }

    public void setPlanId(Long planId) {
        this.planId = planId;
    }

    public DiagnosticTool getTool() {
        return tool;
    }

    public void setTool(DiagnosticTool tool) {
        this.tool = tool;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public DiagnosticPriority getPriority() {
        return priority;
    }

    public void setPriority(DiagnosticPriority priority) {
        this.priority = priority;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
