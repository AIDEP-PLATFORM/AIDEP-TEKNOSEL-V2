import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8001',
})

// ─── Types ──────────────────────────────────────────────────────

export interface UserResponse {
  id: string
  email: string
  phone: string
  full_name: string
  role: 'CITIZEN' | 'VOLUNTEER' | 'NGO'
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  phone: string        // must be in +90XXXXXXXXXX format
  password: string
  full_name: string
  tc_no?: string
  organization_name: string
  authorization_number?: string
}

// ─── Helpers ────────────────────────────────────────────────────

/** Converts "0532 123 45 67" → "+905321234567" */
export function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, '') // "05321234567"
  if (digits.startsWith('0')) {
    return '+90' + digits.slice(1)        // "+905321234567"
  }
  return '+' + digits
}

/** Maps org dropdown value → display name for organization_name */
export function orgLabel(val: string): string {
  const map: Record<string, string> = {
    afad:    'AFAD',
    umke:    'UMKE',
    kizilay: 'Kızılay',
    stk:     'STK',
    other:   'Diğer',
  }
  return map[val] ?? val
}

// ─── API Calls ──────────────────────────────────────────────────

/** Axios hata mesajını okunabilir Türkçeye çevirir */
export function extractErrorMessage(err: unknown): string {
  const axiosErr = err as {
    response?: { data?: { detail?: unknown }; status?: number }
    request?: unknown
    message?: string
  }

  if (axiosErr.response) {
    const detail = axiosErr.response.data?.detail
    if (typeof detail === 'string') return detail
    // Pydantic 422 validation errors → array of objects
    if (Array.isArray(detail)) {
      return detail
        .map((d: { msg?: string; loc?: string[] }) =>
          [d.loc?.slice(-1)[0], d.msg].filter(Boolean).join(': ')
        )
        .join(' | ')
    }
    const status = axiosErr.response.status
    if (status === 409) return 'Bu e-posta veya telefon zaten kayıtlı.'
    if (status === 401) return 'E-posta veya şifre hatalı.'
    if (status === 422) return 'Gönderilen veriler geçersiz. Lütfen kontrol edin.'
  }

  if (axiosErr.request) {
    return 'Sunucuya ulaşılamıyor. Docker backend çalışıyor mu? (localhost:8001)'
  }

  return axiosErr.message ?? 'Bilinmeyen bir hata oluştu.'
}

export async function apiLogin(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await API.post<TokenResponse>('/auth/login', payload)
  return data
}

export async function apiRegisterNgo(payload: RegisterPayload): Promise<TokenResponse> {
  const { data } = await API.post<TokenResponse>('/auth/register/ngo', payload)
  return data
}
