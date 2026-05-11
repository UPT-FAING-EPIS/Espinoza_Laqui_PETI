import { request } from './http'
import type { AuthSession, LoginCredentials, UpdateDefaultViewPayload, UserSummary } from '../types'

export function login(credentials: LoginCredentials) {
  return request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function fetchCurrentUser() {
  return request<UserSummary>('/auth/me')
}

export function updateMyDefaultView(payload: UpdateDefaultViewPayload) {
  return request<UserSummary>('/auth/me/default-view', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
