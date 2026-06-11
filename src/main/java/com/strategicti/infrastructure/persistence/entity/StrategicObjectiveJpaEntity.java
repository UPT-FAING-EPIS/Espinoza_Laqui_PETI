package com.strategicti.infrastructure.persistence.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "strategic_objectives")
public class StrategicObjectiveJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private StrategicPlanJpaEntity plan;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false, length = 1000)
    private String generalObjective;

    @ElementCollection
    @CollectionTable(
            name = "strategic_objective_specifics",
            joinColumns = @JoinColumn(name = "objective_id")
    )
    @OrderColumn(name = "position")
    @Column(name = "specific_objective", length = 1000)
    private List<String> specificObjectives = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public StrategicPlanJpaEntity getPlan() {
        return plan;
    }

    public void setPlan(StrategicPlanJpaEntity plan) {
        this.plan = plan;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }

    public String getGeneralObjective() {
        return generalObjective;
    }

    public void setGeneralObjective(String generalObjective) {
        this.generalObjective = generalObjective;
    }

    public List<String> getSpecificObjectives() {
        return specificObjectives;
    }

    public void setSpecificObjectives(List<String> specificObjectives) {
        this.specificObjectives = specificObjectives;
    }
}
