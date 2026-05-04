import { apiClient } from './api.client';
import { Route, RouteRequest } from '@/types/route.types';

export const routeService = {
  getOptimalRoute: (data: RouteRequest, token: string) =>
    apiClient.post<Route>('/routes/optimize', data, token),

  getRouteById: (id: string, token: string) =>
    apiClient.get<Route>(`/routes/${id}`, token),
};
