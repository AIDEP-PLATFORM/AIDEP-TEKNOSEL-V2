import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ── Shapes ────────────────────────────────────────────────────────

export interface AdminOrgInfo {
  id: string
  name: string
  city: string
  district: string
}

export interface AdminUserResponse {
  id: string
  email: string
  full_name: string
  phone: string
  tc_no: string | null
  role: string
  is_active: boolean
  created_at: string
  ngo_manager_profile: {
    organization: AdminOrgInfo | null
    activity_areas: string[]
    address: string | null
  } | null
  ngo_staff_profile: { organization: AdminOrgInfo | null } | null
  official_profile: {
    organization: AdminOrgInfo | null
    registration_number: string
    address: string | null
  } | null
  volunteer_profile: {
    organization: AdminOrgInfo | null
    skills: string[]
    skills_completed: boolean
    is_available: boolean
  } | null
}

export interface ApproveResponse {
  message: string
  user_id: string
  is_active: boolean
}

// ── Helpers ───────────────────────────────────────────────────────

export function getUserOrg(u: AdminUserResponse): string {
  return u.ngo_manager_profile?.organization?.name
    ?? u.ngo_staff_profile?.organization?.name
    ?? u.official_profile?.organization?.name
    ?? u.volunteer_profile?.organization?.name
    ?? '—'
}

export function getUserCity(u: AdminUserResponse): string {
  return u.ngo_manager_profile?.organization?.city
    ?? u.ngo_staff_profile?.organization?.city
    ?? u.official_profile?.organization?.city
    ?? u.volunteer_profile?.organization?.city
    ?? '—'
}

// ── API calls ─────────────────────────────────────────────────────

export async function apiAdminGetUsers(params?: {
  role?: string
  is_active?: boolean
}): Promise<AdminUserResponse[]> {
  const { data } = await API.get<AdminUserResponse[]>('/admin/users', {
    headers: auth(),
    params,
  })
  return data
}

export async function apiAdminGetPending(): Promise<AdminUserResponse[]> {
  const { data } = await API.get<AdminUserResponse[]>('/admin/users/pending', {
    headers: auth(),
  })
  return data
}

export async function apiAdminApprove(userId: string): Promise<ApproveResponse> {
  const { data } = await API.put<ApproveResponse>(`/admin/users/${userId}/approve`, {}, {
    headers: auth(),
  })
  return data
}

export async function apiAdminDeactivate(userId: string): Promise<ApproveResponse> {
  const { data } = await API.put<ApproveResponse>(`/admin/users/${userId}/deactivate`, {}, {
    headers: auth(),
  })
  return data
}

export async function apiAdminActivate(userId: string): Promise<ApproveResponse> {
  const { data } = await API.put<ApproveResponse>(`/admin/users/${userId}/activate`, {}, {
    headers: auth(),
  })
  return data
}

export interface ActivityLogEntry {
  time: string
  type: string
  msg: string
  color: string
}

export async function apiGetActivityLog(limit = 20): Promise<ActivityLogEntry[]> {
  const { data } = await API.get<ActivityLogEntry[]>('/admin/activity-log', {
    headers: auth(),
    params: { limit },
  })
  return data
}
