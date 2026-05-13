import { request } from './http'
import type {
  CompanyProfile,
  CreatePhaseChangeRequestPayload,
  IdentitySectionSummary,
  PetiPhase,
  PhaseChangeRequestSummary,
  PhaseVersionSummary,
  PlanSummary,
  ReviewPhaseChangeRequestPayload,
  UpdateIdentityPayload,
} from '../types'

export function getCurrentPlan() {
  return request<PlanSummary>('/plans/current')
}

export function saveCompanyProfile(profile: CompanyProfile) {
  return request<PlanSummary>('/plans/current/company', {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export function completePhase(phase: PetiPhase) {
  return request<PlanSummary>(`/plans/current/phases/${phase}/complete`, {
    method: 'POST',
  })
}

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

export function saveGroupPlanIdentity(groupId: number, payload: UpdateIdentityPayload) {
  return request<IdentitySectionSummary>(`/groups/${groupId}/plan/identity`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
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

export function listPhaseVersions(groupId: number, phase: PetiPhase) {
  return request<PhaseVersionSummary[]>(`/groups/${groupId}/plan/phases/${phase}/versions`)
}
