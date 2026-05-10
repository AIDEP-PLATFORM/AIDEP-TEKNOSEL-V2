import { AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth.types';

const MOCK_DELAY = 800;

const mockResponse = (data: LoginRequest | RegisterRequest): AuthResponse => ({
  user: {
    id: 'mock-user-1',
    email: data.email,
    fullName: 'fullName' in data ? data.fullName : 'Test Kullanıcı',
    role: 'role' in data ? data.role : 'citizen',
    phone: 'phone' in data ? data.phone : undefined,
  },
  tokens: {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  },
});

export const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> =>
    new Promise((res) => setTimeout(() => res(mockResponse(data)), MOCK_DELAY)),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    new Promise((res) => setTimeout(() => res(mockResponse(data)), MOCK_DELAY)),

  refreshToken: (_refreshToken: string): Promise<AuthResponse> =>
    new Promise((res) => setTimeout(() => res(mockResponse({ email: '', password: '' })), MOCK_DELAY)),

  logout: (_token: string): Promise<void> =>
    new Promise((res) => setTimeout(res, 300)),
};
