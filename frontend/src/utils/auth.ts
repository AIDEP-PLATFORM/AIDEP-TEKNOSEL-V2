const TOKEN_KEY   = 'aidep_token'
const EXPIRY_KEY  = 'aidep_token_expiry'
const ROLE_KEY    = 'aidep_role'

// Token süreleri (ms)
const TOKEN_TTL = 60 * 60 * 1000 // 1 saat

export type UserRole = 'admin' | 'afad' | 'stk' | 'umke'

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
    removeToken() // süresi dolmuşsa temizle
    return false
  }
  return true
}

// ── Rol işlemleri ─────────────────────────────────────────────────
export const setRole = (role: UserRole): void =>
  localStorage.setItem(ROLE_KEY, role)

export const getRole = (): UserRole | null =>
  localStorage.getItem(ROLE_KEY) as UserRole | null

// Belirli rollerin erişebildiği sayfalar
const ROLE_ACCESS: Record<string, UserRole[]> = {
  '/dashboard':  ['admin', 'afad', 'stk', 'umke'],
  '/requests':   ['admin', 'afad', 'stk', 'umke'],
  '/volunteers': ['admin', 'afad', 'umke'],
  '/map':        ['admin', 'afad', 'stk', 'umke'],
  '/resources':  ['admin', 'afad'],
  '/simulation': ['admin', 'afad', 'stk'],
}

export const canAccess = (path: string): boolean => {
  const role = getRole()
  if (!role) return false
  const allowed = ROLE_ACCESS[path]
  if (!allowed) return true // tanımsız sayfa → serbest
  return allowed.includes(role)
}
