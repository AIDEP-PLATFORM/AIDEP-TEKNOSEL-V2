export type UserRole =
  | 'CITIZEN'
  | 'VOLUNTEER'
  | 'NGO_MANAGER'
  | 'NGO_STAFF'
  | 'OFFICIAL_MANAGER'
  | 'OFFICIAL_STAFF'
  | 'ADMIN';

export interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}

// ─── Login ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Register ─────────────────────────────────────────────────

export interface CitizenRegisterRequest {
  tc_no: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  organization_id?: string; // varsa → VOLUNTEER
}

export interface NgoManagerRegisterRequest {
  tc_no: string;
  full_name: string;
  organization_id: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
  activity_areas: string[];
  address?: string;
}

export interface NgoStaffRegisterRequest {
  tc_no: string;
  full_name: string;
  organization_id: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}

export interface OfficialRegisterRequest {
  tc_no: string;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirm: string;
  organization_id: string;
  registration_number: string;
  address?: string;
}

// ─── Responses ────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

/** NGO kayıtları token dönmez, admin/yönetici onayı beklenir */
export interface PendingRegisterResponse {
  user: User;
  pending: true;
}
