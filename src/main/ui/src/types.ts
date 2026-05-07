export type PetiPhase = 'IDENTITY' | 'DIAGNOSTICS' | 'FORMULATION' | 'CONSOLIDATION'

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

export type PlanSummary = {
  id: number | null
  profile: CompanyProfile
  activePhase: PetiPhase
  totalProgress: number
  phases: PhaseSnapshot[]
  updatedAt: string
}
