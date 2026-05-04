import { Coordinates } from './damage.types';

export type RouteStatus = 'safe' | 'risky' | 'blocked';

export interface RouteSegment {
  coordinates: Coordinates[];
  status: RouteStatus;
  riskScore: number;
}

export interface Route {
  id: string;
  segments: RouteSegment[];
  totalDistance: number;
  estimatedDuration: number;
  riskScore: number;
  createdAt: string;
}

export interface RouteRequest {
  origin: Coordinates;
  destination: Coordinates;
}
