import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { LoadingScreen } from '@/components/common/loading-screen';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Redirect href="/(app)/(tabs)/home" />;
  return <Redirect href="/(auth)/login" />;
}
