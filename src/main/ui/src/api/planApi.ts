import { request } from './http'
import type { CompanyProfile, IdentitySectionSummary, PetiPhase, PlanSummary, UpdateIdentityPayload } from '../types'

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
