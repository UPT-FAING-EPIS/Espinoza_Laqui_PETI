import type { GroupRole } from './common'

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
