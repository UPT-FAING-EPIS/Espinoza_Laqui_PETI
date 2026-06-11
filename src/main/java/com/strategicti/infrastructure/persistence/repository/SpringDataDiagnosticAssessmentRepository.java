package com.strategicti.infrastructure.persistence.repository;

import com.strategicti.domain.model.DiagnosticTool;
import com.strategicti.infrastructure.persistence.entity.DiagnosticAssessmentJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataDiagnosticAssessmentRepository extends JpaRepository<DiagnosticAssessmentJpaEntity, Long> {
    List<DiagnosticAssessmentJpaEntity> findByPlanIdAndToolOrderByPositionAsc(Long planId, DiagnosticTool tool);

    void deleteByPlanIdAndTool(Long planId, DiagnosticTool tool);
}
