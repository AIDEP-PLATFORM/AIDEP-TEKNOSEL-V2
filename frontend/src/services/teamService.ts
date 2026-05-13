import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export interface TeamMemberResponse {
  user_id: string
  full_name: string
  role: string
  has_location: boolean
}

export interface TeamResponse {
  id: string
  organization_id: string
  name: string
  description: string | null
  active_task_count: number
  member_count: number
  created_at: string
}

export interface TeamDetailResponse {
  id: string
  organization_id: string
  name: string
  description: string | null
  active_task_count: number
  created_at: string
  members: TeamMemberResponse[]
}

export interface TeamCreate {
  name: string
  description?: string
}

export async function apiGetTeams(): Promise<TeamResponse[]> {
  const { data } = await API.get<TeamResponse[]>('/teams', { headers: auth() })
  return data
}

export async function apiGetTeamDetail(id: string): Promise<TeamDetailResponse> {
  const { data } = await API.get<TeamDetailResponse>(`/teams/${id}`, { headers: auth() })
  return data
}

export async function apiCreateTeam(body: TeamCreate): Promise<TeamResponse> {
  const { data } = await API.post<TeamResponse>('/teams', body, { headers: auth() })
  return data
}

export async function apiDeleteTeam(id: string): Promise<void> {
  await API.delete(`/teams/${id}`, { headers: auth() })
}

export async function apiAddTeamMember(teamId: string, userId: string): Promise<TeamDetailResponse> {
  const { data } = await API.post<TeamDetailResponse>(
    `/teams/${teamId}/members`,
    { user_id: userId },
    { headers: auth() }
  )
  return data
}

export async function apiRemoveTeamMember(teamId: string, memberUserId: string): Promise<TeamDetailResponse> {
  const { data } = await API.delete<TeamDetailResponse>(
    `/teams/${teamId}/members/${memberUserId}`,
    { headers: auth() }
  )
  return data
}
