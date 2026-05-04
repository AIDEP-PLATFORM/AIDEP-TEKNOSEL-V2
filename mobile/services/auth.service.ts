import { apiClient } from './api.client';
import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth.types';

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }),

  logout: (token: string) =>
    apiClient.post<void>('/auth/logout', {}, token),
};
