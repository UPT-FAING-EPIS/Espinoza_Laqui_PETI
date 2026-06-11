package com.strategicti.infrastructure.persistence.factory;

import com.strategicti.domain.model.PlanChangeRequest;
import com.strategicti.domain.model.PlanPhaseChangeEntry;
import com.strategicti.domain.model.PlanPhaseVersion;
import com.strategicti.infrastructure.persistence.entity.PlanChangeEntryJpaEntity;
import com.strategicti.infrastructure.persistence.entity.PlanChangeRequestJpaEntity;
import com.strategicti.infrastructure.persistence.entity.PlanPhaseVersionJpaEntity;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class PlanPhaseWorkflowPersistenceFactory {
    public PlanChangeRequestJpaEntity toEntity(PlanChangeRequest request, PlanChangeRequestJpaEntity entity) {
        entity.setPlanId(request.planId());
        entity.setPhase(request.phase());
        entity.setStatus(request.status());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setProposedContentJson(request.proposedContentJson());
        entity.setCreatedByUserId(request.createdByUserId());
        entity.setCreatedAt(request.createdAt());
        entity.setSubmittedAt(request.submittedAt());
        entity.setReviewedByUserId(request.reviewedByUserId());
        entity.setReviewedAt(request.reviewedAt());
        entity.setReviewComment(request.reviewComment());
        entity.setUpdatedAt(request.updatedAt());
        replaceEntries(entity, request.entries());
        return entity;
    }

    public PlanChangeRequest toDomain(PlanChangeRequestJpaEntity entity) {
        return new PlanChangeRequest(
                entity.getId(),
                entity.getPlanId(),
                entity.getPhase(),
                entity.getStatus(),
                emptyIfNull(entity.getTitle()),
                emptyIfNull(entity.getDescription()),
                emptyIfNull(entity.getProposedContentJson()),
                entries(entity),
                entity.getCreatedByUserId(),
                entity.getCreatedAt(),
                entity.getSubmittedAt(),
                entity.getReviewedByUserId(),
                entity.getReviewedAt(),
                emptyIfNull(entity.getReviewComment()),
                entity.getUpdatedAt()
        );
    }

    public PlanPhaseVersionJpaEntity toEntity(PlanPhaseVersion version) {
        PlanPhaseVersionJpaEntity entity = new PlanPhaseVersionJpaEntity();
        entity.setPlanId(version.planId());
        entity.setPhase(version.phase());
        entity.setVersionNumber(version.versionNumber());
        entity.setOfficial(version.official());
        entity.setSourceChangeRequestId(version.sourceChangeRequestId());
        entity.setContentJson(version.contentJson());
        entity.setCreatedByUserId(version.createdByUserId());
        entity.setApprovedByUserId(version.approvedByUserId());
        entity.setCreatedAt(version.createdAt());
        entity.setApprovedAt(version.approvedAt());
        return entity;
    }

    public PlanPhaseVersion toDomain(PlanPhaseVersionJpaEntity entity) {
        return new PlanPhaseVersion(
                entity.getId(),
                entity.getPlanId(),
                entity.getPhase(),
                entity.getVersionNumber(),
                entity.isOfficial(),
                entity.getSourceChangeRequestId(),
                emptyIfNull(entity.getContentJson()),
                entity.getCreatedByUserId(),
                entity.getApprovedByUserId(),
                entity.getCreatedAt(),
                entity.getApprovedAt()
        );
    }

    private void replaceEntries(PlanChangeRequestJpaEntity entity, List<PlanPhaseChangeEntry> entries) {
        entity.getEntries().clear();
        int index = 0;
        for (PlanPhaseChangeEntry entry : entries) {
            PlanChangeEntryJpaEntity child = new PlanChangeEntryJpaEntity();
            child.setRequest(entity);
            child.setPosition(index++);
            child.setFieldKey(entry.fieldKey());
            child.setPreviousValue(entry.previousValue());
            child.setProposedValue(entry.proposedValue());
            entity.getEntries().add(child);
        }
    }

    private List<PlanPhaseChangeEntry> entries(PlanChangeRequestJpaEntity entity) {
        return entity.getEntries().stream()
                .sorted(Comparator.comparing(PlanChangeEntryJpaEntity::getPosition))
                .map(entry -> new PlanPhaseChangeEntry(
                        emptyIfNull(entry.getFieldKey()),
                        emptyIfNull(entry.getPreviousValue()),
                        emptyIfNull(entry.getProposedValue())
                ))
                .toList();
    }

    private String emptyIfNull(String value) {
        return value == null ? "" : value;
    }
}
