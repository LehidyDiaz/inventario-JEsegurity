const configuredUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const API_URL = configuredUrl.endsWith('/api') ? configuredUrl : `${configuredUrl}/api`
const TOKEN_KEY = 'jesegurity_auth_token'

export class ApiError extends Error {
  errors: Record<string, string[]>
  status: number

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export const authToken = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

function handleUnauthorized(status: number) {
  if (status !== 401) return
  authToken.clear()
  window.dispatchEvent(new Event('jesegurity:session-expired'))
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = authToken.get()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    handleUnauthorized(response.status)
    const errors = (data?.errors ?? {}) as Record<string, string[]>
    const firstValidationError = Object.values(errors).flat()[0]
    throw new ApiError(firstValidationError || data?.message || 'No se pudo completar la solicitud.', response.status, errors)
  }
  return (data?.data ?? data) as T
}

export async function apiFormRequest<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { Accept: 'application/json', ...(authToken.get() ? { Authorization: `Bearer ${authToken.get()}` } : {}) }, body: form })
  const data = await response.json().catch(() => null)
  if (!response.ok) { handleUnauthorized(response.status); throw new ApiError(Object.values((data?.errors ?? {}) as Record<string, string[]>).flat()[0] || data?.message || 'No se pudo subir el archivo.', response.status, data?.errors) }
  return (data?.data ?? data) as T
}

export async function apiDownload(path: string, filename?: string) {
  const response = await fetch(`${API_URL}${path}`, { headers: { ...(authToken.get() ? { Authorization: `Bearer ${authToken.get()}` } : {}) } })
  if (!response.ok) { handleUnauthorized(response.status); throw new ApiError('No se pudo descargar el archivo.', response.status) }
  const blob = await response.blob(); const link = document.createElement('a'); link.href = URL.createObjectURL(blob)
  link.download = filename || response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] || 'descarga'; link.click(); URL.revokeObjectURL(link.href)
}

export function resourceApi<T, P>(path: string) {
  return {
    list: () => apiRequest<T[]>(`/${path}`),
    create: (payload: P) => apiRequest<T>(`/${path}`, { method: 'POST', body: payload }),
    update: (id: number, payload: P) => apiRequest<T>(`/${path}/${id}`, { method: 'PUT', body: payload }),
    remove: (id: number) => apiRequest<void>(`/${path}/${id}`, { method: 'DELETE' }),
  }
}
