import { request } from './http'
import type {
  CreatePhaseChangeRequestPayload,
  BcgSummary,
  IdentitySectionSummary,
  PetiPhase,
  PhaseChangeRequestSummary,
  PhaseVersionSummary,
  PestSummary,
  PorterSummary,
  PlanSummary,
  ReviewPhaseChangeRequestPayload,
  SwotSummary,
  ValueChainSummary,
} from '../types'

export function createGroupPlan(groupId: number) {
  return request<PlanSummary>(`/groups/${groupId}/plan`, {
    method: 'POST',
  })
}

export function getGroupPlan(groupId: number) {
  return request<PlanSummary>(`/groups/${groupId}/plan`)
}

export function getGroupPlanIdentity(groupId: number) {
  return request<IdentitySectionSummary>(`/groups/${groupId}/plan/identity`)
}

export function getGroupPlanSwot(groupId: number) {
  return request<SwotSummary>(`/groups/${groupId}/plan/diagnostics/foda`)
}

export function getGroupPlanPest(groupId: number) {
  return request<PestSummary>(`/groups/${groupId}/plan/diagnostics/pest`)
}

export function getGroupPlanPorter(groupId: number) {
  return request<PorterSummary>(`/groups/${groupId}/plan/diagnostics/porter`)
}

export function getGroupPlanValueChain(groupId: number) {
  return request<ValueChainSummary>(`/groups/${groupId}/plan/diagnostics/value-chain`)
}

export function getGroupPlanBcg(groupId: number) {
  return request<BcgSummary>(`/groups/${groupId}/plan/diagnostics/bcg`)
}

export function listPhaseChangeRequests(groupId: number, phase: PetiPhase) {
  return request<PhaseChangeRequestSummary[]>(`/groups/${groupId}/plan/phases/${phase}/changes`)
}

export function createPhaseChangeRequest(
  groupId: number,
  phase: PetiPhase,
  payload: CreatePhaseChangeRequestPayload,
) {
  return request<PhaseChangeRequestSummary>(`/groups/${groupId}/plan/phases/${phase}/changes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updatePhaseChangeRequest(
  groupId: number,
  phase: PetiPhase,
  requestId: number,
  payload: CreatePhaseChangeRequestPayload,
) {
  return request<PhaseChangeRequestSummary>(`/groups/${groupId}/plan/phases/${phase}/changes/${requestId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function submitPhaseChangeRequest(groupId: number, phase: PetiPhase, requestId: number) {
  return request<PhaseChangeRequestSummary>(`/groups/${groupId}/plan/phases/${phase}/changes/${requestId}/submit`, {
    method: 'POST',
  })
}

export function approvePhaseChangeRequest(
  groupId: number,
  phase: PetiPhase,
  requestId: number,
  payload: ReviewPhaseChangeRequestPayload,
) {
  return request<PhaseChangeRequestSummary>(`/groups/${groupId}/plan/phases/${phase}/changes/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function rejectPhaseChangeRequest(
  groupId: number,
  phase: PetiPhase,
  requestId: number,
  payload: ReviewPhaseChangeRequestPayload,
) {
  return request<PhaseChangeRequestSummary>(`/groups/${groupId}/plan/phases/${phase}/changes/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function discardPhaseChangeRequest(groupId: number, phase: PetiPhase, requestId: number) {
  return request<void>(`/groups/${groupId}/plan/phases/${phase}/changes/${requestId}`, {
    method: 'DELETE',
  })
}

export function listPhaseVersions(groupId: number, phase: PetiPhase) {
  return request<PhaseVersionSummary[]>(`/groups/${groupId}/plan/phases/${phase}/versions`)
}
