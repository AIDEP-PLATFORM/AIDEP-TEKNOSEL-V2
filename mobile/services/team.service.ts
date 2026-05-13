import { apiClient } from './api.client';

export interface TeamMember {
  user_id: string;
  full_name: string;
  role: string;
  has_location: boolean;
}

export interface MyTeam {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  active_task_count: number;
  created_at: string;
  members: TeamMember[];
}

export interface ActiveTask {
  id: string;
  latitude: number;
  longitude: number;
  need_type: string;
  urgency_level: number;
  person_count: number;
  description: string | null;
  status: string;
  created_at: string;
  assignment: {
    id: string;
    status: string;
    route_distance_km: number;
    route_duration_minutes: number;
    route_geometry: [number, number][] | null;
    route_steps: any[] | null;
  } | null;
}

const NEED_TYPE_LABELS: Record<string, string> = {
  FOOD:     'Gıda',
  WATER:    'Su',
  MEDICAL:  'Tıbbi Yardım',
  SHELTER:  'Barınak',
  RESCUE:   'Kurtarma',
  CLOTHING: 'Giysi',
  OTHER:    'Diğer',
};

export const needTypeLabel = (type: string) => NEED_TYPE_LABELS[type] ?? type;

export const teamService = {
  getMyTeam: (token: string): Promise<MyTeam> =>
    apiClient.get<MyTeam>('/teams/my-team', token),

  getMyTask: (token: string): Promise<ActiveTask | null> =>
    apiClient.get<ActiveTask | null>('/requests/my-task', token),
};
