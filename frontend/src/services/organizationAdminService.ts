import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const authHeader = () => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export type OrgType = 'STK' | 'OFFICIAL'

export interface OrganizationCreate {
  name: string
  city: string
  district: string
  org_type: OrgType
}

export interface OrganizationRecord {
  id: string
  name: string
  city: string
  district: string
  org_type: OrgType
  created_at: string
}

export async function apiCreateOrganization(data: OrganizationCreate): Promise<OrganizationRecord> {
  const { data: res } = await API.post<OrganizationRecord>('/organizations', data, {
    headers: authHeader(),
  })
  return res
}

export async function apiListOrganizations(org_type?: OrgType): Promise<OrganizationRecord[]> {
  const { data } = await API.get<OrganizationRecord[]>('/organizations', {
    params: org_type ? { org_type } : {},
    headers: authHeader(),
  })
  return data
}
