/* ---- Enums (union types matching Java enums) ---- */

export type SystemRole = 'ADMINISTRADOR' | 'USUARIO'
export type UserStatus = 'ACTIVO' | 'INACTIVO'
export type GroupRole = 'LIDER' | 'EDITOR'
export type DefaultView = 'CURRENT_PLAN' | 'MY_GROUPS' | 'USER_MANAGEMENT' | 'GROUP_MANAGEMENT'

/* ---- Auth ---- */

export type LoginCredentials = {
  email: string
  password: string
}

export type UserSummary = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: SystemRole
  status: UserStatus
  defaultView: DefaultView | null
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  tokenType: string
  accessToken: string
  expiresInSeconds: number
  user: UserSummary
}

/* ---- Users ---- */

export type CreateUserPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: SystemRole
}

export type UpdateUserPayload = {
  firstName: string
  lastName: string
  email: string
  role: SystemRole
}

export type UpdateCredentialsPayload = {
  password: string
}

export type UpdateDefaultViewPayload = {
  defaultView: DefaultView
}

/* ---- Groups ---- */

export type GroupMemberSummary = {
  userId: number
  firstName: string
  lastName: string
  email: string
  role: GroupRole
  joinedAt: string
}

export type PlanningGroupSummary = {
  id: number
  name: string
  description: string
  members: GroupMemberSummary[]
  createdAt: string
  updatedAt: string
}

export type CreateGroupPayload = {
  name: string
  description: string
}

export type UpdateGroupPayload = {
  name: string
  description: string
}

export type AssignMemberPayload = {
  userId: number
  role: GroupRole
}

export type UpdateMemberRolePayload = {
  role: GroupRole
}

/* ---- PETI Plan ---- */

export type PetiPhase = 'IDENTITY' | 'DIAGNOSTICS' | 'FORMULATION' | 'CONSOLIDATION'
export type PhaseChangeStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
export type DiagnosticPriority = 'BAJA' | 'MEDIA' | 'ALTA'
export type SwotCategory = 'FORTALEZA' | 'OPORTUNIDAD' | 'DEBILIDAD' | 'AMENAZA'
export type ValueChainActivityType = 'APOYO' | 'PRIMARIA'
export type ValueChainActivity =
  | 'INFRAESTRUCTURA_EMPRESARIAL'
  | 'GESTION_RECURSOS_HUMANOS'
  | 'COMPRAS'
  | 'DESARROLLO_TECNOLOGICO'
  | 'LOGISTICA_ENTRADA'
  | 'OPERACIONES'
  | 'LOGISTICA_SALIDA'
  | 'MARKETING_VENTAS'
  | 'SERVICIOS'
export type BcgQuadrant = 'ESTRELLA' | 'INCOGNITA' | 'VACA' | 'PERRO'
export type BcgStrategicDecision = 'POTENCIAR' | 'EVALUAR' | 'MANTENER' | 'REESTRUCTURAR_O_DESINVERTIR'

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

export type ValueChainActivityPayload = {
  activity: ValueChainActivity
  description: string
  priority: DiagnosticPriority
}

export type ValueChainAssessmentPayload = {
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
  activity: ValueChainActivity
  statement: string
  score: number
  notes: string
  position: number
}

export type ValueChainSummary = {
  planId: number | null
  supportActivities: ValueChainActivitySummary[]
  primaryActivities: ValueChainActivitySummary[]
  assessments: ValueChainAssessmentSummary[]
  observations: string
  strengths: string[]
  weaknesses: string[]
  totalScore: number
  maxScore: number
  scorePercentage: number
  updatedAt: string
}

export type BcgPortfolioItemPayload = {
  name: string
  description: string
  annualSales: number
  marketGrowthRate: number
  relativeMarketShare: number
  notes: string
}

export type UpdateBcgPayload = {
  products: BcgPortfolioItemPayload[]
  marketGrowthThreshold: number
  relativeMarketShareThreshold: number
  observations: string
  strengths: string[]
  weaknesses: string[]
}

export type BcgPortfolioItemSummary = {
  id: number | null
  name: string
  description: string
  annualSales: number
  salesPercentage: number
  marketGrowthRate: number
  relativeMarketShare: number
  quadrant: BcgQuadrant
  strategicDecision: BcgStrategicDecision
  strategicDecisionLabel: string
  notes: string
  position: number
}

export type BcgSummary = {
  planId: number | null
  products: BcgPortfolioItemSummary[]
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
