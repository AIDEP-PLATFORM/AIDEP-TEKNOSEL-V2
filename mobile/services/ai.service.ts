import { API_BASE_URL } from '@/constants/config';
import { apiClient } from './api.client';
import {
  AiStatusResponse,
  DamageDetectionResponse,
  DamageMapCell,
} from '@/types/ai.types';

export const aiService = {
  /**
   * Fotoğrafı YOLOv8m ile analiz eder.
   * multipart/form-data: file + latitude + longitude + report_id (opsiyonel)
   */
  analyzeDamage: async (
    photoUri: string,
    latitude: number,
    longitude: number,
    token: string,
    reportId?: string,
  ): Promise<DamageDetectionResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('latitude', String(latitude));
    formData.append('longitude', String(longitude));
    if (reportId) {
      formData.append('report_id', reportId);
    }
    return apiClient.postFormData<DamageDetectionResponse>('/ai/analyze-damage', formData, token);
  },

  /** Hasar haritası grid hücrelerini getirir. */
  getDamageMap: (token: string): Promise<DamageMapCell[]> =>
    apiClient.get<DamageMapCell[]>('/ai/damage-map', token),

  /** Koordinata göre hava durumu skorunu getirir. */
  getWeatherScore: (latitude: number, longitude: number, token: string) =>
    apiClient.get<{ meteorology_score: number; description: string }>(
      `/ai/weather-score?latitude=${latitude}&longitude=${longitude}`,
      token,
    ),

  /** AI model yükleme durumunu getirir. */
  getStatus: (token: string): Promise<AiStatusResponse> =>
    apiClient.get<AiStatusResponse>('/ai/status', token),
};
