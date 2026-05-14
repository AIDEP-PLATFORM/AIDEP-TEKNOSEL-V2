import axios from 'axios'
import { getToken } from '@/utils/auth'

const API = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8001') + '/api/v1',
})

// ── Raw API response shapes ──────────────────────────────────────

interface EarthquakeRaw {
  event_id: string
  magnitude: number
  depth: number
  location: string
  latitude: number
  longitude: number
  occurred_at: string
}

interface SafeAreaRaw {
  osm_id: number
  latitude: number
  longitude: number
  name: string | null
  capacity: number | null
}

interface ApiListResponse<T> {
  count: number
  cached: boolean
  data: T[]
}

// ── Normalised shapes used by the UI ───────────────────────────

export interface Earthquake {
  id: string
  magnitude: number
  depth: number
  location: string
  latitude: number
  longitude: number
  time: string
}

export interface SafeArea {
  id: string
  name: string
  type: string
  latitude: number
  longitude: number
  capacity?: number
}

export interface TeamLocation {
  id: string
  name: string
  role: string
  organization: string
  latitude: number
  longitude: number
  status: string
  last_updated: string
}

export interface ActiveRoute {
  requestId: string
  teamId: string | null
  assignmentStatus: 'ASSIGNED' | 'EN_ROUTE'
  needType: string
  destLat: number
  destLon: number
  geometry: [number, number][]   // [[lon, lat], ...] — OSRM formatı
  distanceKm: number
  durationMin: number
}

// ── API functions ────────────────────────────────────────────────

export async function apiGetEarthquakes(): Promise<Earthquake[]> {
  const { data } = await API.get<ApiListResponse<EarthquakeRaw>>('/map/earthquakes')
  return (data.data ?? []).map(e => ({
    id:        e.event_id,
    magnitude: e.magnitude,
    depth:     e.depth,
    location:  e.location,
    latitude:  e.latitude,
    longitude: e.longitude,
    time:      e.occurred_at,
  }))
}

export async function apiGetSafeAreas(): Promise<SafeArea[]> {
  const { data } = await API.get<ApiListResponse<SafeAreaRaw>>('/map/safe-areas')
  return (data.data ?? []).map(s => ({
    id:        String(s.osm_id),
    name:      s.name ?? 'Toplanma Alanı',
    type:      'Toplanma Noktası',
    latitude:  s.latitude,
    longitude: s.longitude,
    capacity:  s.capacity ?? undefined,
  }))
}

export interface ActiveRequestForMap {
  id: string
  needType: string
  urgencyLevel: number
  personCount: number
  latitude: number
  longitude: number
  status: string
  assignmentStatus?: string
  routeGeometry?: [number, number][]
}

export async function apiGetMapRequests(): Promise<ActiveRequestForMap[]> {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const [assigned, enRoute] = await Promise.all([
    API.get('/requests', { headers, params: { status: 'ASSIGNED' } }),
    API.get('/requests', { headers, params: { status: 'EN_ROUTE' } }),
  ])

  return [...(assigned.data ?? []), ...(enRoute.data ?? [])].map((r: any) => ({
    id:               r.id,
    needType:         r.need_type,
    urgencyLevel:     r.urgency_level,
    personCount:      r.person_count,
    latitude:         r.latitude,
    longitude:        r.longitude,
    status:           r.status,
    assignmentStatus: r.assignment?.status,
    routeGeometry:    r.assignment?.route_geometry ?? undefined,
  }))
}

export interface CompletedRequest {
  id: string
  latitude: number
  longitude: number
  needType: string
  teamId: string | null
}

export async function apiGetCompletedRequests(): Promise<CompletedRequest[]> {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const { data } = await API.get('/requests', { headers, params: { status: 'COMPLETED' } })
  return (data ?? []).map((r: any) => ({
    id:        r.id,
    latitude:  r.latitude,
    longitude: r.longitude,
    needType:  r.need_type,
    teamId:    r.assignment?.team_id ?? null,
  }))
}

export async function apiGetActiveRoutes(): Promise<ActiveRoute[]> {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const [assigned, enRoute] = await Promise.all([
    API.get('/requests', { headers, params: { status: 'ASSIGNED' } }),
    API.get('/requests', { headers, params: { status: 'EN_ROUTE' } }),
  ])

  const all = [...(assigned.data ?? []), ...(enRoute.data ?? [])]

  return all
    .filter((r: any) => r.assignment?.route_geometry?.length > 0)
    .map((r: any) => ({
      requestId:        r.id,
      teamId:           r.assignment.team_id,
      assignmentStatus: r.assignment.status as 'ASSIGNED' | 'EN_ROUTE',
      needType:         r.need_type,
      destLat:          r.latitude,
      destLon:          r.longitude,
      geometry:         r.assignment.route_geometry,
      distanceKm:       r.assignment.route_distance_km ?? 0,
      durationMin:      r.assignment.route_duration_minutes ?? 0,
    }))
}

export interface DamageCell {
  grid_cell_id: string
  latitude: number
  longitude: number
  aggregated_score: number
  report_count: number
  is_confirmed: boolean
}

export async function apiGetDamageMap(): Promise<DamageCell[]> {
  const token = getToken()
  const { data } = await API.get<DamageCell[]>('/ai/damage-map', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data ?? []
}

export async function apiClearDamageMap(): Promise<{ deleted_keys: number; message: string }> {
  const token = getToken()
  const { data } = await API.delete('/ai/damage-map', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export async function apiGetTeams(): Promise<TeamLocation[]> {
  const token = getToken()
  const { data } = await API.get<TeamLocation[] | ApiListResponse<TeamLocation>>('/map/teams', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  // Handle both array and wrapped response
  if (Array.isArray(data)) return data
  return (data as ApiListResponse<TeamLocation>).data ?? []
}
