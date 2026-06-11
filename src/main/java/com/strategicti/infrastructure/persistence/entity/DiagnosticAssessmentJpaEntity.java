package com.strategicti.infrastructure.persistence.entity;

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
@Table(name = "diagnostic_assessments")
public class DiagnosticAssessmentJpaEntity {
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
    private String statement;

    @Column(nullable = false)
    private int score;

    @Column(length = 1000)
    private String notes;

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

    public String getStatement() {
        return statement;
    }

    public void setStatement(String statement) {
        this.statement = statement;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
