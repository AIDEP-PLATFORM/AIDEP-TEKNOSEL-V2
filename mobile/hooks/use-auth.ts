import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import {
  LoginRequest,
  CitizenRegisterRequest,
  NgoManagerRegisterRequest,
  NgoStaffRegisterRequest,
  OfficialRegisterRequest,
} from '@/types/auth.types';

export function useAuth() {
  const { user, tokens, isLoading, setUser, clearAuth } = useAuthStore();

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    setUser(response.user, response.tokens);
    return response;
  };

  const registerCitizen = async (data: CitizenRegisterRequest) => {
    const response = await authService.registerCitizen(data);
    setUser(response.user, response.tokens);
    return response;
  };

  const registerNgoManager = async (data: NgoManagerRegisterRequest) => {
    return await authService.registerNgoManager(data); // token yok, store'a yazma
  };

  const registerNgoStaff = async (data: NgoStaffRegisterRequest) => {
    return await authService.registerNgoStaff(data); // token yok, store'a yazma
  };

  const registerOfficial = async (data: OfficialRegisterRequest) => {
    const response = await authService.registerOfficial(data);
    setUser(response.user, response.tokens);
    return response;
  };

  const logout = async () => {
    if (tokens?.accessToken) {
      await authService.logout(tokens.accessToken).catch(() => {});
    }
    clearAuth();
  };

  return {
    user,
    tokens,
    isLoading,
    login,
    registerCitizen,
    registerNgoManager,
    registerNgoStaff,
    registerOfficial,
    logout,
  };
}
