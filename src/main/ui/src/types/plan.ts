import type { PetiPhase, PhaseChangeStatus } from './common'

export type CompanyProfile = {
  companyName: string
  businessLine: string
  description: string
  mission: string
  vision: string
  valuesText: string
}

export type PhaseSnapshot = {
  phase: PetiPhase
  title: string
  description: string
  completed: boolean
  locked: boolean
  progress: number
}

export type StrategicObjective = {
  generalObjective: string
  specificObjectives: string[]
}

export type PlanSummary = {
  id: number | null
  groupId: number | null
  profile: CompanyProfile
  objectives: StrategicObjective[]
  activePhase: PetiPhase
  totalProgress: number
  phases: PhaseSnapshot[]
  updatedAt: string
}

export type IdentitySectionSummary = {
  planId: number | null
  groupId: number | null
  mission: string
  vision: string
  valuesText: string
  objectives: StrategicObjective[]
  updatedAt: string
}

export type UpdateIdentityPayload = {
  companyName: string
  businessLine: string
  description: string
  mission: string
  vision: string
  valuesText: string
  objectives: StrategicObjective[]
}

export type PhaseChangeEntry = {
  fieldKey: string
  previousValue: string
  proposedValue: string
}

export type CreatePhaseChangeRequestPayload = {
  title: string
  description: string
  proposedContent: Record<string, unknown>
  entries: PhaseChangeEntry[]
}

export type ReviewPhaseChangeRequestPayload = {
  comment: string
}

export type PhaseChangeRequestSummary = {
  id: number
  planId: number
  phase: PetiPhase
  status: PhaseChangeStatus
  title: string
  description: string
  proposedContent: Record<string, unknown>
  entries: PhaseChangeEntry[]
  createdByUserId: number
  createdAt: string
  submittedAt: string | null
  reviewedByUserId: number | null
  reviewedAt: string | null
  reviewComment: string
  updatedAt: string
}

export type PhaseVersionSummary = {
  id: number
  planId: number
  phase: PetiPhase
  versionNumber: number
  official: boolean
  sourceChangeRequestId: number | null
  content: Record<string, unknown>
  createdByUserId: number
  approvedByUserId: number
  createdAt: string
  approvedAt: string
}
