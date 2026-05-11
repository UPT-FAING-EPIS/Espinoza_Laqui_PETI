import { request } from './http'
import type { CompanyProfile, PetiPhase, PlanSummary } from '../types'

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
