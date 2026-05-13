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
};
