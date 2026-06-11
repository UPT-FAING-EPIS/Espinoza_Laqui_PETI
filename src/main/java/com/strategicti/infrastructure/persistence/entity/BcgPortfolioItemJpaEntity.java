package com.strategicti.infrastructure.persistence.entity;

import com.strategicti.domain.model.BcgQuadrant;
import com.strategicti.domain.model.BcgStrategicDecision;
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
@Table(name = "bcg_portfolio_items")
public class BcgPortfolioItemJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long planId;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private double annualSales;

    @Column(nullable = false)
    private double salesPercentage;

    @Column(nullable = false)
    private double marketGrowthRate;

    @Column(nullable = false)
    private double relativeMarketShare;

    @Column(nullable = false)
    private double marketGrowthThreshold = 10.0;

    @Column(nullable = false)
    private double relativeMarketShareThreshold = 1.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private BcgQuadrant quadrant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 60)
    private BcgStrategicDecision strategicDecision;

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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getAnnualSales() {
        return annualSales;
    }

    public void setAnnualSales(double annualSales) {
        this.annualSales = annualSales;
    }

    public double getSalesPercentage() {
        return salesPercentage;
    }

    public void setSalesPercentage(double salesPercentage) {
        this.salesPercentage = salesPercentage;
    }

    public double getMarketGrowthRate() {
        return marketGrowthRate;
    }

    public void setMarketGrowthRate(double marketGrowthRate) {
        this.marketGrowthRate = marketGrowthRate;
    }

    public double getRelativeMarketShare() {
        return relativeMarketShare;
    }

    public void setRelativeMarketShare(double relativeMarketShare) {
        this.relativeMarketShare = relativeMarketShare;
    }

    public double getMarketGrowthThreshold() {
        return marketGrowthThreshold;
    }

    public void setMarketGrowthThreshold(double marketGrowthThreshold) {
        this.marketGrowthThreshold = marketGrowthThreshold;
    }

    public double getRelativeMarketShareThreshold() {
        return relativeMarketShareThreshold;
    }

    public void setRelativeMarketShareThreshold(double relativeMarketShareThreshold) {
        this.relativeMarketShareThreshold = relativeMarketShareThreshold;
    }

    public BcgQuadrant getQuadrant() {
        return quadrant;
    }

    public void setQuadrant(BcgQuadrant quadrant) {
        this.quadrant = quadrant;
    }

    public BcgStrategicDecision getStrategicDecision() {
        return strategicDecision;
    }

    public void setStrategicDecision(BcgStrategicDecision strategicDecision) {
        this.strategicDecision = strategicDecision;
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
