const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

type ApiError = {
  message?: string
}

const AUTH_EXPIRED_EVENT = 'strategicti:auth-expired'

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  const token = localStorage.getItem('access_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend este levantado.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError
    if (response.status === 401) {
      localStorage.removeItem('access_token')
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT))
    }
    throw new Error(body.message ?? 'No se pudo completar la operacion.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
