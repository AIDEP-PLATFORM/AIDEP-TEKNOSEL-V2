import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { LoginRequest, RegisterRequest } from '@/types/auth.types';

export function useAuth() {
  const { user, tokens, isLoading, setUser, clearAuth } = useAuthStore();

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    setUser(response.user, response.tokens);
    return response;
  };

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data);
    setUser(response.user, response.tokens);
    return response;
  };

  const logout = async () => {
    if (tokens?.accessToken) {
      await authService.logout(tokens.accessToken).catch(() => {});
    }
    clearAuth();
  };

  return { user, tokens, isLoading, login, register, logout };
}
