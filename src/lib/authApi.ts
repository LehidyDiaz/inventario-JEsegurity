const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const tokenKey = 'jesegurity_auth_token'

export type AuthUser = { id: number; name: string; email: string; role: string }

export function getAuthToken(): string | null {
  return localStorage.getItem(tokenKey)
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${apiUrl}/auth.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.')
  localStorage.setItem(tokenKey, data.token)
  return data.user as AuthUser
}

export function logout(): void {
  localStorage.removeItem(tokenKey)
}