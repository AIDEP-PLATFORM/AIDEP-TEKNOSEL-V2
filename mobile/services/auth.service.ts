import { apiClient } from './api.client';
import {
  User,
  AuthResponse,
  LoginRequest,
  CitizenRegisterRequest,
  NgoManagerRegisterRequest,
  NgoStaffRegisterRequest,
  OfficialRegisterRequest,
  PendingRegisterResponse,
} from '@/types/auth.types';

// ─── Backend response shapes ───────────────────────────────────

interface BackendUser {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  user: BackendUser;
}

// ─── Helpers ───────────────────────────────────────────────────

function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.full_name,
    role: u.role as User['role'],
    isActive: u.is_active,
    createdAt: u.created_at,
  };
}

function mapTokenResponse(res: BackendTokenResponse): AuthResponse {
  return {
    user: mapUser(res.user),
    tokens: { accessToken: res.access_token },
  };
}

/** 05551234567 → +905551234567 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return '+90' + cleaned.slice(1);
  return '+90' + cleaned;
}

// ─── Service ───────────────────────────────────────────────────

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<BackendTokenResponse>('/auth/login', {
      email: data.email,
      password: data.password,
      platform: 'mobile',
    });
    return mapTokenResponse(res);
  },

  /** Vatandaş kaydı. organization_id varsa → Gönüllü */
  registerCitizen: async (data: CitizenRegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<BackendTokenResponse>('/auth/register', {
      ...data,
      phone: formatPhone(data.phone),
    });
    return mapTokenResponse(res);
  },

  /** STK Yönetim Personeli — admin onayı beklenir, token dönmez */
  registerNgoManager: async (data: NgoManagerRegisterRequest): Promise<PendingRegisterResponse> => {
    const res = await apiClient.post<BackendUser>('/auth/register/ngo-manager', {
      ...data,
      phone: formatPhone(data.phone),
    });
    return { user: mapUser(res), pending: true };
  },

  /** STK Saha Personeli — yönetici onayı beklenir, token dönmez */
  registerNgoStaff: async (data: NgoStaffRegisterRequest): Promise<PendingRegisterResponse> => {
    const res = await apiClient.post<BackendUser>('/auth/register/ngo-staff', {
      ...data,
      phone: formatPhone(data.phone),
    });
    return { user: mapUser(res), pending: true };
  },

  /** AFAD / UMKE — onay gerekmez, anında giriş yapabilir */
  registerOfficial: async (data: OfficialRegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<BackendTokenResponse>('/auth/register/official', {
      ...data,
      phone: formatPhone(data.phone),
    });
    return mapTokenResponse(res);
  },

  logout: async (_token: string): Promise<void> => {
    // Backend logout endpoint henüz yok
  },
};
