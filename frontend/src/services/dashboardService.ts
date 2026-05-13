import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export interface DashboardSummary {
  active_requests: number
  completed_requests: number
  cancelled_requests: number
  total_requests: number
  available_volunteers: number
  total_volunteers: number
}

export async function apiGetDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await API.get<DashboardSummary>('/dashboard/summary', { headers: auth() })
  return data
}
