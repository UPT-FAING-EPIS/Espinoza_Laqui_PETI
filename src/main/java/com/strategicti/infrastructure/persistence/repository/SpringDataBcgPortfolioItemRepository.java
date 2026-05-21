package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.infrastructure.persistence.entity.BcgPortfolioItemJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataBcgPortfolioItemRepository extends JpaRepository<BcgPortfolioItemJpaEntity, Long> {
    List<BcgPortfolioItemJpaEntity> findByPlanIdOrderByPositionAsc(Long planId);

    void deleteByPlanId(Long planId);
}
