import type { UpdateSwotPayload } from './diagnostics'

export type StrategyRelation = 'FO' | 'AF' | 'AD' | 'OD'

export type StrategyIdentificationPayload = UpdateSwotPayload & {
  scores: Record<StrategyRelation, number[][]>
  selectedStrategy: StrategyRelation | ''
}

export type CameActionPayload = {
  relatedItem: string
  action: string
}

export type CamePayload = {
  correctWeaknesses: CameActionPayload[]
  faceThreats: CameActionPayload[]
  maintainStrengths: CameActionPayload[]
  exploitOpportunities: CameActionPayload[]
}
