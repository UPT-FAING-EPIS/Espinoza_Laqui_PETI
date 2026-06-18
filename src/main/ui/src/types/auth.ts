import type { DefaultView, SystemRole, UserStatus } from './common'

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
