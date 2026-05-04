export type DamageLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type DamageStatus = 'pending' | 'analyzing' | 'confirmed' | 'resolved';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DamageReport {
  id: string;
  userId: string;
  coordinates: Coordinates;
  photoUrls: string[];
  damageLevel: DamageLevel;
  status: DamageStatus;
  description?: string;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDamageReportRequest {
  coordinates: Coordinates;
  photos: string[];
  description?: string;
}
