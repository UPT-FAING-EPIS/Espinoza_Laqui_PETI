import { request } from './http'
import type {
  AssignMemberPayload,
  CreateGroupPayload,
  PlanningGroupSummary,
  UpdateGroupPayload,
  UpdateMemberRolePayload,
} from '../types'

export function listMyGroups() {
  return request<PlanningGroupSummary[]>('/groups/my')
}

export function listGroups() {
  return request<PlanningGroupSummary[]>('/groups')
}

export function getGroup(id: number) {
  return request<PlanningGroupSummary>(`/groups/${id}`)
}

export function createGroup(payload: CreateGroupPayload) {
  return request<PlanningGroupSummary>('/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGroup(id: number, payload: UpdateGroupPayload) {
  return request<PlanningGroupSummary>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function assignMember(groupId: number, payload: AssignMemberPayload) {
  return request<PlanningGroupSummary>(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateMemberRole(groupId: number, userId: number, payload: UpdateMemberRolePayload) {
  return request<PlanningGroupSummary>(`/groups/${groupId}/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeMember(groupId: number, userId: number) {
  return request<PlanningGroupSummary>(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  })
}
