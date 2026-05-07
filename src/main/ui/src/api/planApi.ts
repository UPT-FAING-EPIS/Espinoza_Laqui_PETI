import type { CompanyProfile, PetiPhase, PlanSummary } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

type ApiError = {
  message?: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError
    throw new Error(body.message ?? 'No se pudo completar la operación.')
  }

  return response.json() as Promise<T>
}

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
