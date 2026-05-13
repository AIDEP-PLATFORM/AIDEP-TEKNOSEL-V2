import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

const auth = () => {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export type NeedType = 'RESCUE' | 'MEDICAL' | 'SHELTER' | 'FOOD' | 'OTHER'
export type RequestStatus = 'PENDING' | 'SCORED' | 'ASSIGNED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED'
export type AssignmentStatus = 'ASSIGNED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED'

export interface RouteStep {
  instruction: string
  street_name: string
  distance_m: number
  duration_s: number
  location: [number, number]  // [lon, lat]
  maneuver: string
}

export interface AssignmentResponse {
  id: string
  team_id: string | null
  route_distance_km: number
  route_duration_minutes: number
  safety_score: number
  composite_score: number
  route_geometry: [number, number][] | null  // [[lon, lat], ...]
  route_steps: RouteStep[] | null
  status: AssignmentStatus
  assigned_at: string
}

export interface HelpRequestResponse {
  id: string
  user_id: string | null
  latitude: number
  longitude: number
  need_type: NeedType
  urgency_level: number
  person_count: number
  description: string | null
  status: RequestStatus
  priority_score: number | null
  area_damage_score: number | null
  created_at: string
  updated_at: string
  assignment: AssignmentResponse | null
  photo_count: number
}

export interface HelpRequestCreate {
  latitude: number
  longitude: number
  need_type: NeedType
  urgency_level: number
  person_count: number
  description?: string
}

export interface MatchingRunResponse {
  matched: number
  unmatched: number
  total_requests: number
  total_volunteers: number
  message: string
}

export async function apiGetRequests(params?: {
  status?: RequestStatus
  need_type?: NeedType
}): Promise<HelpRequestResponse[]> {
  const { data } = await API.get<HelpRequestResponse[]>('/requests', {
    headers: auth(),
    params,
  })
  return data
}

export async function apiGetRequest(id: string): Promise<HelpRequestResponse> {
  const { data } = await API.get<HelpRequestResponse>(`/requests/${id}`, {
    headers: auth(),
  })
  return data
}

export async function apiCreateRequest(body: HelpRequestCreate): Promise<HelpRequestResponse> {
  const { data } = await API.post<HelpRequestResponse>('/requests', body, {
    headers: auth(),
  })
  return data
}

export async function apiCancelRequest(id: string): Promise<HelpRequestResponse> {
  const { data } = await API.delete<HelpRequestResponse>(`/requests/${id}`, {
    headers: auth(),
  })
  return data
}

export async function apiUpdateAssignmentStatus(
  requestId: string,
  status: AssignmentStatus
): Promise<HelpRequestResponse> {
  const { data } = await API.put<HelpRequestResponse>(
    `/requests/${requestId}/assignment-status`,
    { status },
    { headers: auth() }
  )
  return data
}

export interface RouteCalculationResult {
  distance_km: number
  duration_min: number
  damage_score: number
  geometry: [number, number][]
  steps: RouteStep[]
  origin: { lat: number; lon: number }
  destination: { lat: number; lon: number }
}

export async function apiCalculateRoute(
  requestId: string,
  originLat: number,
  originLon: number,
): Promise<RouteCalculationResult> {
  const { data } = await API.get<RouteCalculationResult>(
    `/requests/${requestId}/route`,
    {
      headers: auth(),
      params: { origin_lat: originLat, origin_lon: originLon },
    },
  )
  return data
}

export async function apiManualAssign(requestId: string, teamId: string): Promise<HelpRequestResponse> {
  const { data } = await API.post<HelpRequestResponse>(
    `/requests/${requestId}/assign`,
    { team_id: teamId },
    { headers: auth() }
  )
  return data
}

export async function apiRunMatching(): Promise<MatchingRunResponse> {
  const { data } = await API.post<MatchingRunResponse>('/requests/matching/run', {}, {
    headers: auth(),
  })
  return data
}

export interface DamagePhotoItem {
  id: string
  request_id: string
  uploaded_by: string | null
  minio_key: string
  original_filename: string | null
  damage_score: number | null
  damage_labels: Record<string, any> | null
  latitude: number | null
  longitude: number | null
  created_at: string
  analysis_success: boolean
  photo_url: string | null
}

export async function apiGetRequestPhotos(requestId: string): Promise<DamagePhotoItem[]> {
  const { data } = await API.get<DamagePhotoItem[]>(`/requests/${requestId}/photos`, {
    headers: auth(),
  })
  return data
}
