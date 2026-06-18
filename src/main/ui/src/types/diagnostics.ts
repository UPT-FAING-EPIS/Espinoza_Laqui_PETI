import type {
  BcgQuadrant,
  BcgStrategicDecision,
  DiagnosticPriority,
  PestFactor,
  PorterForce,
  SwotCategory,
  ValueChainActivity,
  ValueChainActivityType,
  ValueChainDimension,
} from './common'

export type SwotItemPayload = {
  description: string
  priority: DiagnosticPriority
}

export type UpdateSwotPayload = {
  strengths: SwotItemPayload[]
  opportunities: SwotItemPayload[]
  weaknesses: SwotItemPayload[]
  threats: SwotItemPayload[]
}

export type SwotItemSummary = {
  id: number | null
  category: SwotCategory
  description: string
  priority: DiagnosticPriority
  position: number
}

export type SwotSummary = {
  planId: number | null
  strengths: SwotItemSummary[]
  opportunities: SwotItemSummary[]
  weaknesses: SwotItemSummary[]
  threats: SwotItemSummary[]
  updatedAt: string
}

export type PestResponsePayload = {
  questionNumber: number
  score: number | null
}

export type DiagnosticFindingPayload = {
  sourceDimension: string
  category: SwotCategory
  description: string
  evidence: string
  impact: string
  priority: DiagnosticPriority
  selectedForFoda: boolean
}

export type UpdatePestPayload = {
  responses: PestResponsePayload[]
  findings: DiagnosticFindingPayload[]
}

export type PestQuestionSummary = {
  questionNumber: number
  factor: PestFactor
  statement: string
  score: number | null
}

export type PestFactorSummary = {
  factor: PestFactor
  label: string
  answeredQuestions: number
  score: number
  maxScore: number
  impactLevel: number
  impactPercentage: number
  notableImpact: boolean
}

export type DiagnosticFindingSummary = DiagnosticFindingPayload & {
  id: number | null
  source: 'PEST' | 'PORTER' | 'VALUE_CHAIN' | 'BCG'
  createdByUserId: number
  position: number
  createdAt: string
  updatedAt: string
}

export type PestSummary = {
  planId: number | null
  questions: PestQuestionSummary[]
  factors: PestFactorSummary[]
  findings: DiagnosticFindingSummary[]
  answeredQuestions: number
  complete: boolean
  updatedAt: string
}

export type PorterResponsePayload = {
  questionNumber: number
  score: number | null
}

export type UpdatePorterPayload = {
  responses: PorterResponsePayload[]
  findings: DiagnosticFindingPayload[]
}

export type PorterQuestionSummary = {
  questionNumber: number
  force: PorterForce
  statement: string
  score: number | null
}

export type PorterForceSummary = {
  force: PorterForce
  label: string
  answeredQuestions: number
  score: number
  maxScore: number
  pressureLevel: number
  pressurePercentage: number
  highPressure: boolean
}

export type PorterSummary = {
  planId: number | null
  questions: PorterQuestionSummary[]
  forces: PorterForceSummary[]
  findings: DiagnosticFindingSummary[]
  answeredQuestions: number
  overallScore: number
  maxOverallScore: number
  pressurePercentage: number
  conclusion: string
  complete: boolean
  updatedAt: string
}

export type ValueChainActivityPayload = {
  activity: ValueChainActivity
  description: string
  priority: DiagnosticPriority
}

export type ValueChainAssessmentPayload = {
  questionNumber: number | null
  activity: ValueChainActivity
  statement: string
  score: number
  notes: string
}

export type UpdateValueChainPayload = {
  supportActivities: ValueChainActivityPayload[]
  primaryActivities: ValueChainActivityPayload[]
  assessments: ValueChainAssessmentPayload[]
  observations: string
  strengths: string[]
  weaknesses: string[]
  findings: DiagnosticFindingPayload[]
}

export type ValueChainActivitySummary = {
  id: number | null
  activity: ValueChainActivity
  type: ValueChainActivityType
  description: string
  priority: DiagnosticPriority
  position: number
}

export type ValueChainAssessmentSummary = {
  id: number | null
  questionNumber: number | null
  activity: ValueChainActivity
  statement: string
  score: number
  notes: string
  position: number
}

export type ValueChainQuestionSummary = {
  questionNumber: number
  activity: ValueChainActivity
  dimensions: ValueChainDimension[]
  statement: string
  score: number | null
}

export type ValueChainDimensionSummary = {
  dimension: ValueChainDimension
  code: string
  label: string
  answeredQuestions: number
  score: number
  maxScore: number
  maturityPercentage: number
  improvementPercentage: number
}

export type ValueChainSummary = {
  planId: number | null
  questions: ValueChainQuestionSummary[]
  dimensions: ValueChainDimensionSummary[]
  findings: DiagnosticFindingSummary[]
  supportActivities: ValueChainActivitySummary[]
  primaryActivities: ValueChainActivitySummary[]
  assessments: ValueChainAssessmentSummary[]
  observations: string
  strengths: string[]
  weaknesses: string[]
  totalScore: number
  maxScore: number
  scorePercentage: number
  answeredQuestions: number
  improvementPercentage: number
  complete: boolean
  conclusion: string
  updatedAt: string
}

export type BcgCompetitorSalePayload = {
  name: string
  sales: number
}

export type BcgPortfolioItemPayload = {
  name: string
  description: string
  annualSales: number
  marketGrowthRate: number
  relativeMarketShare: number
  marketGrowthRates: number[]
  sectorDemandValues: number[]
  competitors: BcgCompetitorSalePayload[]
  notes: string
}

export type UpdateBcgPayload = {
  products: BcgPortfolioItemPayload[]
  marketGrowthThreshold: number
  relativeMarketShareThreshold: number
  observations: string
  strengths: string[]
  weaknesses: string[]
  findings: DiagnosticFindingPayload[]
}

export type BcgCompetitorSaleSummary = {
  name: string
  sales: number
}

export type BcgPortfolioItemSummary = {
  id: number | null
  name: string
  description: string
  annualSales: number
  salesPercentage: number
  marketGrowthRate: number
  relativeMarketShare: number
  marketGrowthRates: number[]
  sectorDemandValues: number[]
  competitors: BcgCompetitorSaleSummary[]
  largestCompetitorSales: number
  quadrant: BcgQuadrant
  strategicDecision: BcgStrategicDecision
  strategicDecisionLabel: string
  notes: string
  position: number
}

export type BcgSummary = {
  planId: number | null
  products: BcgPortfolioItemSummary[]
  findings: DiagnosticFindingSummary[]
  observations: string
  strengths: string[]
  weaknesses: string[]
  marketGrowthThreshold: number
  relativeMarketShareThreshold: number
  totalSales: number
  stars: number
  questionMarks: number
  cashCows: number
  dogs: number
  updatedAt: string
}
