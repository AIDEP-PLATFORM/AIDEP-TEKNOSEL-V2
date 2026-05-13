import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export interface OrgMember {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  is_active: boolean
  skills: string[]
  active_task_count: number
  has_location: boolean
  created_at: string
}

export interface VolunteerActionResponse {
  message: string
  user_id: string
  is_active: boolean
}

export async function apiGetOrgMembers(): Promise<OrgMember[]> {
  const { data } = await API.get<OrgMember[]>('/volunteers/org-members', { headers: auth() })
  return data
}

export async function apiGetPendingVolunteers(): Promise<OrgMember[]> {
  const { data } = await API.get<OrgMember[]>('/volunteers/pending', { headers: auth() })
  return data
}

export async function apiApproveVolunteer(userId: string): Promise<VolunteerActionResponse> {
  const { data } = await API.put<VolunteerActionResponse>(`/volunteers/${userId}/approve`, {}, { headers: auth() })
  return data
}

export async function apiRejectVolunteer(userId: string): Promise<VolunteerActionResponse> {
  const { data } = await API.put<VolunteerActionResponse>(`/volunteers/${userId}/reject`, {}, { headers: auth() })
  return data
}

export async function apiGetOrgMembersByOrgId(orgId: string): Promise<OrgMember[]> {
  const { data } = await API.get<OrgMember[]>(`/volunteers/org/${orgId}/members`, { headers: auth() })
  return data
}
