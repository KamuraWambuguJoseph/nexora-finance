// In production the frontend is served by the same Express server as the API,
// so we call the same origin (relative URL). In dev, Vite runs on 5173 and the
// API on 4000, so we fall back to localhost:4000 unless VITE_API_URL is set.
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000')
const TOKEN_KEY = 'nexora_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && auth) {
      logout()
    }
    throw new Error(data.error || `Request failed (${res.status})`)
  }

  return data
}
