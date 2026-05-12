const TOKEN_KEY   = 'aidep_token'
const EXPIRY_KEY  = 'aidep_token_expiry'
const ROLE_KEY    = 'aidep_role'
const USER_KEY    = 'aidep_user'

// Token süreleri (ms) — backend ile aynı: 24 saat
const TOKEN_TTL = 24 * 60 * 60 * 1000

export type UserRole =
  | 'ADMIN'
  | 'NGO_MANAGER'
  | 'NGO_STAFF'
  | 'OFFICIAL_MANAGER'
  | 'OFFICIAL_STAFF'
  | 'VOLUNTEER'
  | 'CITIZEN'
  | string

// ── Temel token işlemleri ──────────────────────────────────────────
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + TOKEN_TTL))
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRY_KEY)
  localStorage.removeItem(ROLE_KEY)
  localStorage.removeItem(USER_KEY)
}

export interface StoredUser {
  id: string
  full_name: string
  email: string
  phone: string
  role: UserRole
  is_active: boolean
  created_at: string
  // NGO Manager
  organization_name?: string
  organization_city?: string
  activity_areas?: string[]
  address?: string
  // Official
  registration_number?: string
}

export const setUser = (user: StoredUser): void =>
  localStorage.setItem(USER_KEY, JSON.stringify(user))

export const getUser = (): StoredUser | null => {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as StoredUser) : null
}

// ── Expiry kontrolü ───────────────────────────────────────────────
export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem(EXPIRY_KEY)
  if (!expiry) return true
  return Date.now() > parseInt(expiry)
}

export const isAuthenticated = (): boolean => {
  if (!getToken()) return false
  if (isTokenExpired()) {
    removeToken()
    return false
  }
  return true
}

// ── Rol işlemleri ─────────────────────────────────────────────────
export const setRole = (role: UserRole): void =>
  localStorage.setItem(ROLE_KEY, role)

export const getRole = (): UserRole | null =>
  localStorage.getItem(ROLE_KEY) as UserRole | null
