export interface DetectionItem {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  damage_score: number;
}

export interface DamageDetectionResponse {
  report_id: string | null;
  detections: DetectionItem[];
  road_damage_score: number;
  building_damage_score: number;
  grid_cell_id: string;
  grid_confirmed_count: number;
  grid_aggregated_score: number;
  is_confirmed: boolean;
  model_source: string;
}

export interface DamageMapCell {
  grid_cell_id: string;
  latitude: number;
  longitude: number;
  aggregated_score: number;
  report_count: number;
  is_confirmed: boolean;
}

export interface AiStatusResponse {
  status: string;
  models_loaded: boolean;
  yolo_ready: boolean;
  xgboost_ready: boolean;
}
