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
