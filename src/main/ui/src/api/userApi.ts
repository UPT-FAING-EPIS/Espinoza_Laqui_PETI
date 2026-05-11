import { request } from './http'
import type {
  CreateUserPayload,
  UpdateCredentialsPayload,
  UpdateUserPayload,
  UserSummary,
} from '../types'

export function listUsers() {
  return request<UserSummary[]>('/users')
}

export function getUser(id: number) {
  return request<UserSummary>(`/users/${id}`)
}

export function createUser(payload: CreateUserPayload) {
  return request<UserSummary>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return request<UserSummary>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function updateCredentials(id: number, payload: UpdateCredentialsPayload) {
  return request<UserSummary>(`/users/${id}/credentials`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function disableUser(id: number) {
  return request<UserSummary>(`/users/${id}/disable`, { method: 'PATCH' })
}

export function enableUser(id: number) {
  return request<UserSummary>(`/users/${id}/enable`, { method: 'PATCH' })
}
