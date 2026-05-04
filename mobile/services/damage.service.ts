import { apiClient } from './api.client';
import { CreateDamageReportRequest, DamageReport } from '@/types/damage.types';

export const damageService = {
  create: (data: CreateDamageReportRequest, token: string) =>
    apiClient.post<DamageReport>('/damage/reports', data, token),

  getAll: (token: string) =>
    apiClient.get<DamageReport[]>('/damage/reports', token),

  getById: (id: string, token: string) =>
    apiClient.get<DamageReport>(`/damage/reports/${id}`, token),

  uploadPhoto: async (photoUri: string, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', { uri: photoUri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);

    const response = await fetch('/damage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();
    return result.url;
  },
};
