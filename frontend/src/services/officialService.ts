import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export interface OfficialMember {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  is_active: boolean
  registration_number: string
  created_at: string
}

export async function apiGetOfficialOrgMembers(orgId: string): Promise<OfficialMember[]> {
  const r = await API.get(`/officials/org/${orgId}/members`, { headers: auth() })
  return r.data
}
