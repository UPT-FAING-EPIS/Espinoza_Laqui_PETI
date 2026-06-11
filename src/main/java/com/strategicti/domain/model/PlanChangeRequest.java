package com.strategicti.domain.model;

import java.time.Instant;
import java.util.List;

public record PlanChangeRequest(
        Long id,
        Long planId,
        PetiPhase phase,
        PhaseChangeStatus status,
        String title,
        String description,
        String proposedContentJson,
        List<PlanPhaseChangeEntry> entries,
        Long createdByUserId,
        Instant createdAt,
        Instant submittedAt,
        Long reviewedByUserId,
        Instant reviewedAt,
        String reviewComment,
        Instant updatedAt
) {
    public PlanChangeRequest {
        entries = entries == null ? List.of() : List.copyOf(entries);
    }

    public static PlanChangeRequest draft(
            Long planId,
            PetiPhase phase,
            String title,
            String description,
            String proposedContentJson,
            List<PlanPhaseChangeEntry> entries,
            Long createdByUserId
    ) {
        Instant now = Instant.now();
        return new PlanChangeRequest(
                null,
                planId,
                phase,
                PhaseChangeStatus.DRAFT,
                title,
                description,
                proposedContentJson,
                entries,
                createdByUserId,
                now,
                null,
                null,
                null,
                "",
                now
        );
    }

    public PlanChangeRequest submit(Long submittedByUserId) {
        if (status != PhaseChangeStatus.DRAFT && status != PhaseChangeStatus.REJECTED) {
            throw new IllegalStateException("Solo una solicitud en borrador o rechazada puede enviarse a revision.");
        }
        Instant now = Instant.now();
        return new PlanChangeRequest(
                id,
                planId,
                phase,
                PhaseChangeStatus.PENDING_APPROVAL,
                title,
                description,
                proposedContentJson,
                entries,
                createdByUserId,
                createdAt,
                now,
                null,
                null,
                "",
                now
        );
    }

    public PlanChangeRequest updateDraft(
            String title,
            String description,
            String proposedContentJson,
            List<PlanPhaseChangeEntry> entries
    ) {
        if (status != PhaseChangeStatus.DRAFT && status != PhaseChangeStatus.REJECTED) {
            throw new IllegalStateException("Solo una solicitud en borrador o rechazada puede editarse.");
        }
        return new PlanChangeRequest(
                id,
                planId,
                phase,
                PhaseChangeStatus.DRAFT,
                title,
                description,
                proposedContentJson,
                entries,
                createdByUserId,
                createdAt,
                null,
                null,
                null,
                "",
                Instant.now()
        );
    }

    public PlanChangeRequest approve(Long reviewerUserId, String comment) {
        assertPending();
        return reviewed(PhaseChangeStatus.APPROVED, reviewerUserId, comment);
    }

    public PlanChangeRequest reject(Long reviewerUserId, String comment) {
        assertPending();
        return reviewed(PhaseChangeStatus.REJECTED, reviewerUserId, comment);
    }

    private PlanChangeRequest reviewed(PhaseChangeStatus nextStatus, Long reviewerUserId, String comment) {
        Instant now = Instant.now();
        return new PlanChangeRequest(
                id,
                planId,
                phase,
                nextStatus,
                title,
                description,
                proposedContentJson,
                entries,
                createdByUserId,
                createdAt,
                submittedAt,
                reviewerUserId,
                now,
                comment == null ? "" : comment,
                now
        );
    }

    private void assertPending() {
        if (status != PhaseChangeStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("La solicitud debe estar pendiente de aprobacion.");
        }
    }
}
