export type UserRole = 'citizen' | 'volunteer' | 'stk' | 'afad';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  organizationId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
