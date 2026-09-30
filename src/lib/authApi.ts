import { apiRequest, authToken } from './api'
import type { AuthUser } from '../types/inventory'

export async function login(email: string, password: string): Promise<AuthUser> {
  const data = await apiRequest<{ token: string; user: AuthUser }>('/login', { method: 'POST', body: { email, password } })
  authToken.set(data.token)
  return data.user
}

export const restoreSession = () => apiRequest<AuthUser>('/me')
export const getProfile = () => apiRequest<AuthUser>('/profile')
export const updateProfile = (body: Record<string, string>) => apiRequest<AuthUser>('/profile', { method: 'PUT', body })
export const forgotPassword = (email: string) => apiRequest<{ message: string }>('/forgot-password', { method: 'POST', body: { email } })
export const resetPassword = (body: { email: string; token: string; password: string; password_confirmation: string }) => apiRequest<{ message: string }>('/reset-password', { method: 'POST', body })

export async function logout(): Promise<void> {
  try { await apiRequest('/logout', { method: 'POST' }) } catch { /* The local session must always end. */ }
  authToken.clear()
}

export { authToken as tokenStore }
export type { AuthUser }
