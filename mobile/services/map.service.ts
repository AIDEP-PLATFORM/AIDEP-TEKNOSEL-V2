import { apiClient } from './api.client';

export interface EarthquakePoint {
  event_id: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  location: string;
  occurred_at: string;
}

export interface SafeAreaPoint {
  osm_id: number;
  latitude: number;
  longitude: number;
  name: string | null;
  capacity: string | null;
}

export interface RouteStep {
  instruction: string;
  street_name: string;
  distance_m: number;
  duration_s: number;
  location: [number, number]; // [lon, lat]
  maneuver: string;
}

export interface AlternativeRoute {
  distance_km: number;
  duration_min: number;
  geometry: [number, number][];
  damage_score: number;
}

export interface RouteData {
  distance_km: number;
  duration_min: number;
  geometry: [number, number][]; // [[lon, lat], ...]
  damage_score: number;
  steps: RouteStep[];
  alternatives?: AlternativeRoute[];
}

interface MapResponse<T> {
  count: number;
  cached: boolean;
  data: T[];
}

export const mapService = {
  getEarthquakes: async (): Promise<EarthquakePoint[]> => {
    const res = await apiClient.get<MapResponse<EarthquakePoint>>('/map/earthquakes');
    return res.data ?? [];
  },

  getSafeAreas: async (): Promise<SafeAreaPoint[]> => {
    const res = await apiClient.get<MapResponse<SafeAreaPoint>>('/map/safe-areas');
    return res.data ?? [];
  },

  nearestRoad: async (
    lat: number,
    lon: number,
    token: string,
  ): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const res = await apiClient.get<{ latitude: number; longitude: number; distance_m: number }>(
        `/map/nearest?lat=${lat}&lon=${lon}`,
        token,
      );
      return { latitude: res.latitude, longitude: res.longitude };
    } catch {
      return null;
    }
  },

  getRoute: async (
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    token: string,
    waypoints?: { latitude: number; longitude: number }[],
  ): Promise<RouteData> => {
    let url = `/map/route?from_lat=${fromLat}&from_lon=${fromLon}&to_lat=${toLat}&to_lon=${toLon}`;
    if (waypoints && waypoints.length > 0) {
      url += waypoints.map(wp => `&via=${wp.latitude},${wp.longitude}`).join('');
    }
    return apiClient.get<RouteData>(url, token);
  },
};
