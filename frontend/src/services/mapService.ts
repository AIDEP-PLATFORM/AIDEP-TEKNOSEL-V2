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

export async function apiGetTeams(): Promise<TeamLocation[]> {
  const token = getToken()
  const { data } = await API.get<TeamLocation[] | ApiListResponse<TeamLocation>>('/map/teams', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  // Handle both array and wrapped response
  if (Array.isArray(data)) return data
  return (data as ApiListResponse<TeamLocation>).data ?? []
}
