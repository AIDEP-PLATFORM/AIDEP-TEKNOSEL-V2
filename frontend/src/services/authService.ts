import axios from 'axios'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

// ─── Types ──────────────────────────────────────────────────────

export type UserRole =
  | 'ADMIN'
  | 'NGO_MANAGER'
  | 'NGO_STAFF'
  | 'OFFICIAL_MANAGER'
  | 'OFFICIAL_STAFF'
  | 'VOLUNTEER'
  | 'CITIZEN'

export interface UserResponse {
  id: string
  email: string
  phone: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

export interface OrganizationBranch {
  id: string
  name: string
  city: string
  district: string
}

export interface LoginPayload {
  email: string
  password: string
  platform: 'web'
}

export interface NgoManagerRegisterPayload {
  tc_no: string
  full_name: string
  organization_id: string
  email: string
  phone: string
  password: string
  password_confirm: string
  activity_areas: string[]
  address?: string
}

export interface OfficialRegisterPayload {
  tc_no: string
  full_name: string
  phone: string
  email: string
  password: string
  password_confirm: string
  organization_id: string
  registration_number: string
  address?: string
}

// ─── Helpers ────────────────────────────────────────────────────

/** "0532 123 45 67" → "+905321234567" */
export function toInternationalPhone(local: string): string {
  const digits = local.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+90' + digits.slice(1)
  return '+' + digits
}

/** Axios hatasını Türkçeye çevirir */
export function extractErrorMessage(err: unknown): string {
  const axiosErr = err as {
    response?: { data?: { detail?: unknown }; status?: number }
    request?: unknown
    message?: string
  }

  if (axiosErr.response) {
    const detail = axiosErr.response.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail
        .map((d: { msg?: string; loc?: string[] }) =>
          [d.loc?.slice(-1)[0], d.msg].filter(Boolean).join(': ')
        )
        .join(' | ')
    }
    const status = axiosErr.response.status
    if (status === 409) return 'Bu e-posta veya telefon zaten kayıtlı.'
    if (status === 401) return 'E-posta veya şifre hatalı ya da hesabınız henüz onaylanmadı.'
    if (status === 403) return 'Bu platforma giriş yetkiniz bulunmuyor.'
    if (status === 422) return 'Gönderilen veriler geçersiz. Lütfen alanları kontrol edin.'
  }

  if (axiosErr.request) {
    return 'Sunucuya ulaşılamıyor. Backend çalışıyor mu?'
  }

  return (err as Error)?.message ?? 'Bilinmeyen bir hata oluştu.'
}

// ─── API Calls ──────────────────────────────────────────────────

export async function apiLogin(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await API.post<TokenResponse>('/auth/login', payload)
  return data
}

/** STK Yetkili kaydı — admin onayı gerekir, token dönmez */
export async function apiRegisterNgoManager(
  payload: NgoManagerRegisterPayload
): Promise<UserResponse> {
  const { data } = await API.post<UserResponse>('/auth/register/ngo-manager', payload)
  return data
}

/** Resmi Yetkili kaydı — onay gerekmez, anında token döner */
export async function apiRegisterOfficial(
  payload: OfficialRegisterPayload
): Promise<TokenResponse> {
  const { data } = await API.post<TokenResponse>('/auth/register/official', payload)
  return data
}

/** STK kurum şubelerini getirir */
export async function apiGetStkOrganizationNames(): Promise<string[]> {
  const { data } = await API.get<string[]>('/organizations/names', {
    params: { org_type: 'STK' },
  })
  return data
}

export async function apiGetStkCities(name: string): Promise<string[]> {
  const { data } = await API.get<string[]>('/organizations/cities', {
    params: { name, org_type: 'STK' },
  })
  return data
}

export async function apiGetStkBranches(name: string, city: string): Promise<OrganizationBranch[]> {
  const { data } = await API.get<OrganizationBranch[]>('/organizations/branches', {
    params: { name, city, org_type: 'STK' },
  })
  return data
}

/** Resmi kurum şubelerini getirir */
export async function apiGetOfficialOrganizationNames(): Promise<string[]> {
  const { data } = await API.get<string[]>('/organizations/names', {
    params: { org_type: 'OFFICIAL' },
  })
  return data
}

export async function apiGetOfficialCities(name: string): Promise<string[]> {
  const { data } = await API.get<string[]>('/organizations/cities', {
    params: { name, org_type: 'OFFICIAL' },
  })
  return data
}

export async function apiGetOfficialBranches(name: string, city: string): Promise<OrganizationBranch[]> {
  const { data } = await API.get<OrganizationBranch[]>('/organizations/branches', {
    params: { name, city, org_type: 'OFFICIAL' },
  })
  return data
}

export async function apiGetMe(token: string): Promise<UserResponse> {
  const { data } = await API.get<UserResponse>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}
