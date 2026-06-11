package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.infrastructure.persistence.entity.DiagnosticItemJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataDiagnosticItemRepository extends JpaRepository<DiagnosticItemJpaEntity, Long> {
    List<DiagnosticItemJpaEntity> findByPlanIdAndToolOrderByPositionAsc(Long planId, DiagnosticTool tool);

    void deleteByPlanIdAndTool(Long planId, DiagnosticTool tool);
}
